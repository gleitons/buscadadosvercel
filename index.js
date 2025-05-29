// index.js
const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

let cache = {
  horario: null,
  lastUpdated: 0,
};

const URL_GOOGLE = 'https://www.google.com/maps/place/Sala+Mineira+do+Empreendedor+de+Lagoa+dos+Patos+MG/@-16.9819823,-44.579404,1078m/data=!3m2!1e3!4b1!4m6!3m5!1s0xaaf030a5a54633:0x140c1f33fb81dfae!8m2!3d-16.9819823!4d-44.579404!16s%2Fg%2F11hd4q35rg?entry=ttu&g_ep=EgoyMDI1MDUyNi4wIKXMDSoJLDEwMjExNDU1SAFQAw%3D%3D'; // encurtar para privacidade

app.get('/horario', async (req, res) => {
  const now = Date.now();
  if (cache.horario && now - cache.lastUpdated < 60 * 60 * 1000) {
    return res.json({ horario: cache.horario, cache: true });
  }

  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(URL_GOOGLE, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('.MkV9 .ZDu9vd'); // seletor correto

    const horario = await page.$eval('.MkV9 .ZDu9vd', el => el.innerText);

    await browser.close();

    cache = {
      horario,
      lastUpdated: now,
    };

    res.json({ horario, cache: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao capturar horário' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
