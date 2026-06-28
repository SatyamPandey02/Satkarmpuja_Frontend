import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
const blogSeoPath = path.join(__dirname, '../src/blogSeoContent.ts');

function run() {
  try {
    if (!fs.existsSync(sitemapPath)) {
      console.error('sitemap.xml not found at:', sitemapPath);
      return;
    }
    if (!fs.existsSync(blogSeoPath)) {
      console.error('blogSeoContent.ts not found at:', blogSeoPath);
      return;
    }

    console.log('Parsing blog metadata for slugs...');
    const blogContent = fs.readFileSync(blogSeoPath, 'utf8');
    const metadataBlocks = blogContent.split('id:');
    const idToSlug = {};

    for (let i = 1; i < metadataBlocks.length; i++) {
      const block = metadataBlocks[i];
      const idMatch = /^[\s\d]+/.exec(block);
      if (!idMatch) continue;
      const id = idMatch[0].trim();
      
      const titleEnMatch = /en:\s*"([^"]+)"/.exec(block);
      if (!titleEnMatch) continue;
      const titleEn = titleEnMatch[1];
      
      const slug = titleEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      idToSlug[id] = slug;
      console.log(`- Blog ID ${id} -> slug: "${slug}"`);
    }

    console.log('Reading sitemap.xml...');
    const rawXml = fs.readFileSync(sitemapPath, 'utf8');

    // Regex to capture each <url> block
    const urlRegex = /<url>([\s\S]*?)<\/url>/g;
    let match;
    const urlBlocks = [];

    while ((match = urlRegex.exec(rawXml)) !== null) {
      urlBlocks.push(match[0]);
    }

    console.log(`Found ${urlBlocks.length} original URLs in sitemap.`);

    const newUrlBlocks = [];

    for (const block of urlBlocks) {
      // Find the URL location <loc>...</loc>
      const locMatch = /<loc>(.*?)<\/loc>/.exec(block);
      if (!locMatch) continue;

      let originalLoc = locMatch[1];

      // Skip if it's already a localized URL
      if (originalLoc.includes('?lang=')) {
        continue;
      }

      // Check if it's a blog-detail URL with numeric ID
      const blogDetailMatch = /\/blog-detail\/(\d+)$/.exec(originalLoc);
      if (blogDetailMatch) {
        const id = blogDetailMatch[1];
        const slug = idToSlug[id];
        if (slug) {
          originalLoc = originalLoc.replace(`/blog-detail/${id}`, `/blog-detail/${slug}`);
        }
      }

      // Add updated original URL block
      const updatedBlock = block.replace(/<loc>(.*?)<\/loc>/, `<loc>${originalLoc}</loc>`);
      newUrlBlocks.push(updatedBlock);

      // Create Hindi and Gujarati variations
      const hiBlock = updatedBlock.replace(originalLoc, `${originalLoc}?lang=hi`);
      const guBlock = updatedBlock.replace(originalLoc, `${originalLoc}?lang=gu`);

      newUrlBlocks.push(hiBlock);
      newUrlBlocks.push(guBlock);
    }

    console.log(`Generated sitemap with ${newUrlBlocks.length} URLs (including slugs and languages).`);

    // Build the final XML
    const finalXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${newUrlBlocks.map(b => b.trim()).join('\n')}
</urlset>`;

    fs.writeFileSync(sitemapPath, finalXml, 'utf8');
    console.log('Successfully updated sitemap.xml!');
  } catch (error) {
    console.error('Error generating multilingual sitemap:', error);
  }
}

run();
