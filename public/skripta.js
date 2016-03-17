window.addEventListener('load', function() {
	//stran nalozena
	
	
	var prizgiCakanje = function() {
		document.querySelector(".loading").style.display = "block";
	}
	
	var ugasniCakanje = function() {
		document.querySelector(".loading").style.display = "none";
	}
	
	document.querySelector("#nalozi").addEventListener("click", prizgiCakanje);
	
	//Pridobi seznam datotek
	var pridobiSeznamDatotek = function(event) {
		prizgiCakanje();
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4 && xhttp.status == 200) {
				var datoteke = JSON.parse(xhttp.responseText);
				
				var datotekeHTML = document.querySelector("#datoteke");
				
				for (var i=0; i<datoteke.length; i++) {
					var datoteka = datoteke[i];
					
					var velikost = datoteka.velikost;
					var enota = "B";
					if (velikost > 1024) {
						velikost /= 1024;
						enota = "KiB";
						if (velikost > 1024) {
							velikost /= 1024;
							enota = "MiB";
							if (velikost > 1024) {
								velikost /= 1024;
								enota = "GiB";
							}
						}
					}
					
					velikost = Math.round(velikost);
					
					datotekeHTML.innerHTML += " \
						<div class='datoteka senca rob'> \
							<div class='naziv_datoteke'> " + datoteka.datoteka + "  (" + velikost + " " + enota + ") </div> \
							<div class='akcije'> \
							 <span><a href='/poglej/" + datoteka.datoteka + "' target='_blank'>Poglej</a></span>\
							| <span><a href='/prenesi/" + datoteka.datoteka + "' target='_self'>Prenesi</a></span> \
							| <span akcija='brisi' datoteka='"+ datoteka.datoteka +"'>Izbriši</span> </div> \
					    </div>";	
				}
				
				if (datoteke.length > 0) {
					var tab = document.querySelectorAll("span[akcija=brisi]");
					for (var i = 0; i < tab.length; i++) {
						tab[i].addEventListener("click", brisi);
					}
				}
				ugasniCakanje();
			}
		};
		xhttp.open("GET", "/datoteke", true);
		xhttp.send();
	}
	pridobiSeznamDatotek();
	
	var brisi = function(event) {
		prizgiCakanje();
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4 && xhttp.status == 200) {
				if (xhttp.responseText == "Datoteka izbrisana") {
					window.location = "/";
				} else {
					alert("Datoteke ni bilo možno izbrisati!");
				}
			}
			ugasniCakanje();
			//document.querySelector("#datoteke").innerHTML = "";
			//pridobiSeznamDatotek();
		};
		xhttp.open("GET", "/brisi/"+this.getAttribute("datoteka"), true);
		xhttp.send();
	}

});