// server.js
import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import fs from 'fs';
import session from 'express-session'

import bodyParser from 'body-parser';

import "dotenv/config";
import {router} from "./routes/router.mjs"


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const securePort = process.env.PORT || 3443;

const app = express();
 
app.use(session({
    secret: process.env.SESSION_SEC,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60*60*1000 },
}));

// Ρύθμιση Handlebars
app.engine('hbs', engine({ extname: 'hbs', defaultLayout: 'main' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Στατικά αρχεία
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/",router);




// Εκκίνηση server

https
   .createServer(
      {
         key: fs.readFileSync('./private.key'),
         cert: fs.readFileSync('./certificate.crt'),
      },
      app
   )
   .listen(securePort, () => {
      console.log(`Η εφαρμογή τρέχει στο https://127.0.0.1:${securePort}/`);
});
 


/* const port = process.env.PORT || '3000';
app.listen(port, () => {
    console.log(`http://127.0.0.1:${port}`);
}); */