import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import "dotenv/config";
import * as model from '../model/model_better_sqlite.mjs';
import calculate_total_price  from '../model/calculate_price.mjs';


let reservations=[
	{id:1,name:"John Doe",zone:"A",people:"5",checkIn:"2025-10-12",checkOut:"2025-10-12"},
	{id:2,name:"John Hoe",zone:"C",people:"2",checkIn:"2025-05-05",checkOut:"2025-05-05"}
];
let zones=[
	{zone:"A",totalAvailability:"1",cost:"1"},
	{zone:"B",totalAvailability:"1",cost:"1"},
	{zone:"C",totalAvailability:"1",cost:"1"},
	{zone:"D",totalAvailability:"1",cost:"1"},
];
let date=new Date();
// reservations=model.getAllReservations(`${date.getFullYear()}-${(date.getMonth()+1)/10<1? ("0"+(date.getMonth()+1)):date.getMonth()+1}-${date.getDate()}`);
const loadServices = async () => {
  try {
    const data = await fs.readFile('data/services.json', 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Σφάλμα ανάγνωσης JSON:', err);
    throw err;
  }
};


async function mainPage(req,res){
      try {
        const services = await loadServices();
        res.render('index', {
            css : ["main_style.css","https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"], 
            script : ["collapsed_menu.js"],
            title: 'Home - Camping Apollon Delphi',
            services
        });
    } catch (err) {
        console.error('Σφάλμα φόρτωσης υπηρεσιών:', err);
        res.status(500).send('Σφάλμα διακομιστή');
    }
}


function contactPage(req,res){
  res.render('contact.hbs', {
    title : "contact",
    css: ["main_style.css"], 
    script : ["collapsed_menu.js", "new_contact_message.js"]
  });
}


async function reservationPage(req,res){
  try{
    let zones = await model.zone_client_info();
    res.render('reservation.hbs', {
      title: "reservation",
      css: ["main_style.css", "reservation-style.css"], 
      script : ["collapsed_menu.js", "reservation.js"],
      zone: zones
    });
  } catch (err) {
    throw err;
  }
}

async function reservation_search(req, res) {
  try {
    const {checkIn:checkin, checkOut:checkout, spacesType:spacetype, spaceNo:spacenum, peopNo:people} = req.body;
  
    console.log('Received data:', req.body);
    //console.log(people);
    let results = await calculate_total_price(checkin, checkout, people, spacenum, spacetype);
    let zones = await model.zone_client_info();
    let price;
    console.log(typeof(results), results);
    if (results !== "Δεν υπάρχει διαθεσιμότητα για τις επιλεγμένες παραμέτρους"){
      price = "Total Price: " + results + "€";
    }
    else{
      price = results;
    }
    res.render('reservation.hbs', {
      title: "reservation",
      css: ["main_style.css", "reservation-style.css"], 
      script : ["collapsed_menu.js", "reservation.js"],
      zone: zones,
      result: [{"checkin": checkin, "checkout": checkout, "spacetype": spacetype, "spacenum": spacenum, "peoplenum": people, "price": price}]
    });
  } catch (err) {
    throw err;
  }
  
}


function login(req,res){
    res.render('connect.hbs', {
    title: "connect",
    css: ["main_style.css", "connection-menu-style.css"], 
    script : ["collapsed_menu.js"]
  });
}


async function sendContactMessage(req,res){
  const { fname, lname, email, telephone, sub, minima } = req.body;

  // Έλεγχος αν λείπουν πεδία
  if (!fname || !lname || !email || !telephone || !sub || !minima) {
    return res.status(400).json({ message: 'Συμπλήρωσε όλα τα πεδία.' });
  }

  try {
    // Δημιουργία transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_ADDR,      
        pass: process.env.EMAIL_PASS             
      }
    });

    // Ρυθμίσεις email
    const mailOptions = {
      from: email,
      to: process.env.EMAIL_ADDR,           
      subject: 'Νέο μήνυμα από τη φόρμα επικοινωνίας',
      text: `Όνομα: ${fname}\nΕπίθετο: ${lname}\nEmail: ${email}\nΤηλέφωνο: ${telephone}\n\nΘέμα: ${sub}\n\nΜήνυμα:\n${minima}`
    };

    // Αποστολή email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ redirect: '/contact' });

  } catch (error) {
    console.error('Σφάλμα αποστολής email:', error);
    res.status(500).json({ message: 'Σφάλμα κατά την αποστολή του μηνύματος.' });
  }
}



function adminPage(req,res){
    try {
      res.render("admin.hbs", {title:"admin Page", css:["main_style.css","adminCustomerPage.css"],script:["adminPage.js"]});
    } catch (error) {
      console.error('Σφάλμα φόρτωσης σελίδας:', error);
      res.status(500).send('Σφάλμα διακομιστή');
    }
}

function addZone(req,res){
    model.addZoneType(req.body);
    res.redirect("/admin");
}
function editZone(req,res){
    zones=req.body;
    model.editZoneType(zones);
    res.send("all fine");
}
function getAllZones(req,res){
    zones=model.getAllZones();
    res.send(JSON.stringify(zones));
}
function deleteZone(req,res){
    let zone2Delete=req.params.zone.replace("_"," ");
    model.deleteZoneType(zone2Delete);
    res.redirect("/admin");
}
function getAllReservations(req,res){
    reservations=model.getAllReservations(req.body.date);
    res.send(JSON.stringify(reservations));
}
function editReservations(req,res){
    if(model.updateReservation(req.body)=="err"){
      res.send("error");
    }else{
      res.send("reservations edited");
    }
}
function deleteReservation(req,res){
  let reservation2Delete=req.params.reservation;
  model.removeReservation(reservation2Delete);
  res.redirect("/admin");
}
function getSpecificVisitor(req,res){
    let id=req.params.id;
    res.send(model.getSpecificVisitor(id));

}

function getVisitors(req,res){
      res.send(model.getAllVisitors());
}

function searchVisitor(req,res){
    let name=req.params.visitorName;
    res.send(model.searchVisitor(name));
}
function getAvailabilities(req,res){
    let date=req.body.date;
    let results=[];
    for(let i=0;i<zones.length;i++){
      let zName=zones[i].name;
      results.push({name:zName,availability:model.searchAdminAvailbility(date,zones[i].name)});
    }
    res.send(JSON.stringify(results));
};
export function editVisitors(req,res){
    let visitors=req.body;
    model.editVisitors(visitors);
    res.send("ok");
}
export function deleteVisitor(req,res){
    let visitor2Delete=req.params.email;
    model.deleteVisitor(visitor2Delete);
    res.redirect("/admin");
}

export function addVisitor(req,res){
    let visitor=req.body;
    model.addVisitor(visitor);
    res.redirect("/admin");
}
export function addReservation(req,res){
    let reservation=req.body;
    console.log(reservation)
    console.log(model.addReservation(reservation));
    res.redirect("/admin");
}
export {mainPage,contactPage,reservationPage,login,sendContactMessage,adminPage,addZone,editZone,getAllZones,getAllReservations,deleteZone,editReservations,deleteReservation,reservation_search,getVisitors,getSpecificVisitor,searchVisitor,getAvailabilities};