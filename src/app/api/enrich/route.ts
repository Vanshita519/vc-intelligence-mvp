import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// In-memory cache to prevent duplicate calls during the same server session
const enrichmentCache = new Map<string, object>();

// Strip HTML tags and extract visible text
function extractTextFromHTML(html: string): string {
    // Remove script and style tags and their content
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
    text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    // Limit to ~8000 chars to fit in context window
    return text.substring(0, 8000);
}

// Check if a page likely exists by looking at HTML content
function checkPageSignals(html: string, url: string): { careers: boolean; blog: boolean; about: boolean; pricing: boolean } {
    const lowerHtml = html.toLowerCase();
    return {
        careers: lowerHtml.includes('career') || lowerHtml.includes('jobs') || lowerHtml.includes('hiring') || lowerHtml.includes('open positions'),
        blog: lowerHtml.includes('blog') || lowerHtml.includes('articles') || lowerHtml.includes('insights') || lowerHtml.includes('news'),
        about: lowerHtml.includes('about us') || lowerHtml.includes('about the company') || lowerHtml.includes('our story') || lowerHtml.includes('our mission'),
        pricing: lowerHtml.includes('pricing') || lowerHtml.includes('plans') || lowerHtml.includes('subscribe'),
    };
}

export async function POST(request: NextRequest) {
    try {
        let url: string;
        let companyName: string;

        try {
            const body = await request.json();
            url = body.url;
            companyName = body.companyName;
        } catch {
            return NextResponse.json(
                { error: 'Invalid request body. Expected JSON with url and companyName.' },
                { status: 400 }
            );
        }

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Check in-memory cache
        const cacheKey = url.toLowerCase().trim();
        if (enrichmentCache.has(cacheKey)) {
            return NextResponse.json(enrichmentCache.get(cacheKey));
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your_key_here' || apiKey === 'your_gemini_api_key_here') {
            return NextResponse.json(
                { error: 'API key not configured. Please set a valid GEMINI_API_KEY in .env.local (get one free at aistudio.google.com)' },
                { status: 500 }
            );
        }

        // Fetch the company website
        let htmlContent: string;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; VCScout/1.0; +https://vcscout.app)',
                    'Accept': 'text/html,application/xhtml+xml',
                },
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`Website returned status ${response.status}`);
            }

            htmlContent = await response.text();
        } catch (fetchError) {
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                return NextResponse.json(
                    { error: 'Website took too long to respond. Try again later.' },
                    { status: 504 }
                );
            }
            return NextResponse.json(
                { error: `Could not fetch website: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` },
                { status: 502 }
            );
        }

        // Extract visible text and check for page signals
        const visibleText = extractTextFromHTML(htmlContent);
        const pageSignals = checkPageSignals(htmlContent, url);

        // Build the Gemini prompt
        const prompt = `You are analyzing a company's website content. The company name is "${companyName}" and the website URL is "${url}".

Here is the extracted visible text from their website:

---
${visibleText}
---

Based on this content, generate a structured analysis in the following JSON format. Be accurate and base everything on the actual content provided:

{
  "summary": "A concise 1-2 sentence summary of what the company does",
  "whatTheyDo": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Rules:
- summary: 1-2 clear sentences about what the company does based on the website content
- whatTheyDo: 3-6 bullet points describing their main products, services, or activities
- keywords: 5-10 relevant industry/technology keywords
- Be factual - only include information that can be derived from the provided text
- Return ONLY valid JSON, no markdown code blocks or extra text`;

        // Call Gemini API
        let geminiResult;
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const result = await model.generateContent(prompt);
            const response = result.response;
            geminiResult = response.text();
        } catch (geminiError) {
            const errorMsg = geminiError instanceof Error ? geminiError.message : 'Unknown error';
            console.error('Gemini API error:', errorMsg);

            if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key not valid') || errorMsg.includes('PERMISSION_DENIED')) {
                return NextResponse.json(
                    { error: 'Invalid API key. Please check your GEMINI_API_KEY in .env.local and restart the dev server.' },
                    { status: 401 }
                );
            }
            if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
                return NextResponse.json(
                    { error: 'Rate limit hit. Wait 60 seconds and try again (Gemini free tier: 15 req/min).' },
                    { status: 429 }
                );
            }
            return NextResponse.json(
                { error: `AI analysis failed: ${errorMsg}` },
                { status: 500 }
            );
        }

        // Parse the Gemini response
        let parsedResult;
        try {
            // Clean up the response - remove markdown code blocks if present
            let cleanedResult = geminiResult.trim();
            if (cleanedResult.startsWith('```json')) {
                cleanedResult = cleanedResult.slice(7);
            }
            if (cleanedResult.startsWith('```')) {
                cleanedResult = cleanedResult.slice(3);
            }
            if (cleanedResult.endsWith('```')) {
                cleanedResult = cleanedResult.slice(0, -3);
            }
            cleanedResult = cleanedResult.trim();

            parsedResult = JSON.parse(cleanedResult);
        } catch {
            return NextResponse.json(
                { error: 'Failed to parse AI response. Try again.' },
                { status: 500 }
            );
        }

        // Build the final enrichment result
        const enrichmentResult = {
            summary: parsedResult.summary || 'No summary available.',
            whatTheyDo: parsedResult.whatTheyDo || [],
            keywords: parsedResult.keywords || [],
            derivedSignals: [
                { signal: 'Careers page detected', present: pageSignals.careers },
                { signal: 'Blog / news section', present: pageSignals.blog },
                { signal: 'About page detected', present: pageSignals.about },
                { signal: 'Pricing page detected', present: pageSignals.pricing },
            ],
            sources: [
                { url: url, title: `${companyName} - Main Website` },
            ],
            timestamp: new Date().toISOString(),
            companyId: '',
        };

        // Store in server-side cache
        enrichmentCache.set(cacheKey, enrichmentResult);

        return NextResponse.json(enrichmentResult);
    } catch (error) {
        console.error('Enrich API error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred during enrichment.' },
            { status: 500 }
        );
    }
}
