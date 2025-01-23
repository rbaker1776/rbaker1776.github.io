

function toggle_menu()
{
    const menu = document.getElementById('side-menu');
    const menu_bg = document.getElementById('gray-menu-bg');
    menu.classList.toggle("hidden");
    menu_bg.classList.toggle("hidden");
}
