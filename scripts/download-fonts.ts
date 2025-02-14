import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

async function downloadFont(url: string, filename: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const buffer = await response.buffer();
        await fs.writeFile(path.join(__dirname, '../src/fonts', filename), buffer);
        console.log(`Successfully downloaded ${filename}`);
    } catch (error) {
        console.error(`Error downloading ${filename}:`, error);
    }
}

async function main() {
    const fonts = [
        {
            url: 'https://fonts.gstatic.com/s/opensans/v35/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.woff2',
            filename: 'OpenSans-Regular.woff2'
        },
        {
            url: 'https://fonts.gstatic.com/s/opensans/v35/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.woff2',
            filename: 'OpenSans-Bold.woff2'
        }
    ];

    for (const font of fonts) {
        await downloadFont(font.url, font.filename);
    }
}

main().catch(console.error);
