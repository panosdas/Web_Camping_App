document.addEventListener('DOMContentLoaded', function() {
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    
        const navBar = document.querySelector('.nav-bar');
        navBar.prepend(mobileMenuBtn);
    
        const menuList = document.querySelector('.nav-bar ul');
    
        mobileMenuBtn.addEventListener('click', function() {
            menuList.classList.toggle('active');
        });
    
    // Close menu when a menu item is clicked
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    menuList.classList.remove('active');
                }
            });
        });
});