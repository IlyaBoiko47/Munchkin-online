document.addEventListener('DOMContentLoaded', (e) => {
	document.getElementById('treasure-b').addEventListener('click',(e) =>{
		document.getElementById('treasure-b').classList.add('treasure-button_show')
		document.getElementById('doors-b').classList.add('doors-button_show')
		
		
		document.getElementById('scroll_menu-treasure').classList.add('scroll_menu-treasure_show')
		document.getElementById('scroll_menu-doors').classList.add('scroll_menu-doors_show')
		
	})
	document.getElementById('doors-b').addEventListener('click',(e) =>{
		document.getElementById('treasure-b').classList.remove('treasure-button_show')
		document.getElementById('doors-b').classList.remove('doors-button_show')

		document.getElementById('scroll_menu-treasure').classList.remove('scroll_menu-treasure_show')
		document.getElementById('scroll_menu-doors').classList.remove('scroll_menu-doors_show')
	})

})


