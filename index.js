// index.js
const express = require('express');
const puppeteer = require('puppeteer');
const cron = require('node-cron');

const app = express();

let cache = {
  horario: null,
  lastUpdated: 0,
};

const URL_GOOGLE = 'https://www.google.com/maps/place/Sala+Mineira+do+Empreendedor+de+Lagoa+dos+Patos+MG/@-16.9819823,-44.579404,1078m/data=!3m2!1e3!4b1!4m6!3m5!1s0xaaf030a5a54633:0x140c1f33fb81dfae!8m2!3d-16.9819823!4d-44.579404!16s%2Fg%2F11hd4q35rg?entry=ttu&g_ep=EgoyMDI1MDUyNi4wIKXMDSoJLDEwMjExNDU1SAFQAw%3D%3D';

async function fetchHorario() {
  try {
    console.log('Buscando horário no Google Maps...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(URL_GOOGLE, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('.MkV9 .ZDu9vd');

    const horario = await page.$eval('.MkV9 .ZDu9vd', el => el.innerText);

    await browser.close();

    cache.horario = horario;
    cache.lastUpdated = Date.now();

    console.log('Horário atualizado:', horario);
  } catch (error) {
    console.error('Erro ao capturar horário:', error);
  }
}

// Agendar para rodar a cada hora na hora cheia (0 minutos de cada hora entre 7 e 23)
cron.schedule('0 7-23 * * *', () => {
  fetchHorario();
});

// Endpoint que retorna o horário do cache
app.get('/horario', (req, res) => {
  if (cache.horario) {
    return res.json({ horario: cache.horario, cache: true, lastUpdated: cache.lastUpdated });
  } else {
    return res.status(503).json({ error: 'Horário ainda não disponível. Aguarde a próxima atualização.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  fetchHorario(); // Busca inicial ao iniciar o servidor
});
