import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sitemapPath = path.join(__dirname, '../public/sitemap.xml');

function run() {
  try {
    if (!fs.existsSync(sitemapPath)) {
      console.error('sitemap.xml not found at:', sitemapPath);
      return;
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

      const originalLoc = locMatch[1];

      // Skip if it's already a localized URL
      if (originalLoc.includes('?lang=')) {
        newUrlBlocks.push(block);
        continue;
      }

      // Add the original URL block
      newUrlBlocks.push(block);

      // Create Hindi and Gujarati variations
      const hiBlock = block.replace(originalLoc, `${originalLoc}?lang=hi`);
      const guBlock = block.replace(originalLoc, `${originalLoc}?lang=gu`);

      newUrlBlocks.push(hiBlock);
      newUrlBlocks.push(guBlock);
    }

    console.log(`Generated multilingual sitemap with ${newUrlBlocks.length} URLs.`);

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
