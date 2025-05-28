import express from "express";
import * as controller from"../controller/controller.mjs"
import * as authController from '../controller/authController.mjs'
import { checkAuth } from '../Middleware/authMiddleware.mjs';
import { rootCertificates } from "tls";

const router=express.Router();

router.get("/",controller.mainPage);

router.get("/reservation",controller.reservationPage);
router.post("/reservation", controller.reservation_search)

router.get("/contact",controller.contactPage);
router.post("/new_contact_message",controller.sendContactMessage);


router.get("/connect", checkAuth, controller.login);

router.use("/admin",authController.checkAuth)
router.get("/admin",controller.adminPage);

router.post("/login", authController.loginLimiter, authController.handleLogin);      
router.get("/logout", authController.handleLogout);   

router.post("/admin/addZone",controller.addZone);
router.post("/admin/editZone",controller.editZone);

router.post("/admin/getZones",controller.getAllZones);
router.post("/admin/getReservations",controller.getAllReservations);

router.get("/admin/deleteZoneType/:zone",controller.deleteZone);

router.post("/admin/addReservation",controller.addReservation);
router.post("/admin/editReservations",controller.editReservations);
router.get("/admin/deleteReservation/:reservation",controller.deleteReservation);


router.post("/admin/getVisitors",controller.getVisitors);
router.post("/admin/visitors/:id",controller.getSpecificVisitor);
router.post("/admin/searchVisitors/:visitorName",controller.searchVisitor);
router.post("/admin/editVisitors",controller.editVisitors);
router.get("/admin/deleteVisitor/:email",controller.deleteVisitor);
router.post("/admin/addVisitor",controller.addVisitor);


router.post("/admin/getAvailabilities",controller.getAvailabilities);


router.use((err,req,res,next)=>{
    res.render("error.hbs",{
        css : ["main_style.css","adminCustomerPage.css"],
        title:"error",
        message:err.message,
        errtrace:err.stack
        });
});

export {router}