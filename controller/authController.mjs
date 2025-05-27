import bcrypt from "bcrypt";
import fs from "fs";
import path from 'path';
import rateLimit from 'express-rate-limit';

const usersPath = path.resolve('data', 'users.json');


const readUsers = () => {
    try {
        const data = fs.readFileSync(usersPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};


export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    handler: (req, res) => {
        
        req.session.rateLimitError = "Πάρα πολλές προσπάθειες σύνδεσης. Παρακαλώ δοκιμάστε ξανά σε 15 λεπτά.";
        res.render('connect.hbs', { 
            error: req.session.rateLimitError,
            title: "connect",
            css: ["main_style.css", "connection-menu-style.css"], 
            script : ["collapsed_menu.js"] 
        }); 
    },
    skipSuccessfulRequests: true, 
});

export const handleLogin = async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).render('connect.hbs', { 
            error: "Απαιτούνται όνομα χρήστη και κωδικός",
            title: "connect",
            css: ["main_style.css", "connection-menu-style.css"], 
            script : ["collapsed_menu.js"] 
        });
    }

    const users = readUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(401).render('connect.hbs', { 
            error: "Λάθος όνομα χρήστη ή κωδικός",
            title: "connect",
            css: ["main_style.css", "connection-menu-style.css"], 
            script : ["collapsed_menu.js"]
        });
    }

    try {
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).render('connect.hbs', { 
                error: "Λάθος όνομα χρήστη ή κωδικός",
                title: "connect",
                css: ["main_style.css", "connection-menu-style.css"], 
                script : ["collapsed_menu.js"] 
            });
        }

        req.session.user = user;
        res.redirect("/admin");
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).render('connect.hbs', { 
            error: "Σφάλμα κατά τη σύνδεση",
            title: "connect",
            css: ["main_style.css", "connection-menu-style.css"], 
            script : ["collapsed_menu.js"]
        });
    }
};

export const handleLogout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).send("Logout failed");
        }
        res.redirect("/");
    });
};
//
export let checkAuth = (req,res,next)=>{
    if(req.session.user){
        next();
    }else{
        res.redirect("/connect")
    }
}