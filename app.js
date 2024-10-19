const express = require('express')
const path = require('path')
const app = express()
const controller = require('./controllers/appController')
const QRCode = require('qrcode');


app.set('view engine','ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"public")))


app.get('/',(req,res)=>{
    res.send("Server is Running")
})


app.get('/report/:barcode',controller.report )

app.get('/reportGenerate/:barcode',controller.generate)

app.get('/wifi',controller.wifi)

app.post("/wifi-QR",controller.wifiqr)

app.get('/GenerateQR/:barcode', async (req, res) => {
    const { barcode } = req.params;
    try {
        // Generate QR code and send as image
        const data = `http:localhost:3000/report/${barcode}`
        const qrImage = await QRCode.toBuffer(data, { type: 'png' });
        res.type('png').send(qrImage);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating QR code');
    }
});


app.listen(3000)

