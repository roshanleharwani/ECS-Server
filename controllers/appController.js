
const puppeteer = require('puppeteer')
const path = require('path')

exports.generate = async (req, res) => {
    let browser;
    try {
        // Launch browser explicitly in headless mode with a timeout
        browser = await puppeteer.launch();

        const page = await browser.newPage();

        // Set a timeout for navigation
        await page.goto(`${req.protocol}://${req.get('host')}/report`, {
            waitUntil: 'networkidle2',
        });

        await page.setViewport({ width: 1680, height: 1050 });

        // Generate the PDF file path
        const filePath = path.join(__dirname, '../public/files/', `${new Date().getTime()}.pdf`);

        // Generate the PDF
        const pdf = await page.pdf({
            path: filePath,
            printBackground: true,
            format: 'A4'
        });

        await browser.close();

        // Set response headers for PDF file
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdf.length
        });

        // Send the generated PDF file
        res.sendFile(filePath);

    } catch (error) {
        console.log(error.message);
        if (browser) {
            await browser.close(); // Ensure browser is closed in case of error
        }
        res.status(500).send('Error generating PDF');
    }
};
