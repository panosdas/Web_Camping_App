export const checkAuth = (req, res, next) => {
    if (req.session.user) { 
        return res.redirect('/admin');
    }
    next();
};