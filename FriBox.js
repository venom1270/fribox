if (!process.env.PORT) {
    process.env.PORT = 8080;
}

var mime = require('mime');
var formidable = require('formidable');
var http = require('http');
var fs = require('fs-extra');
var util = require('util');
var path = require('path');

var dataDir = "./data/";

var streznik = http.createServer(function(zahteva, odgovor) {
   if (zahteva.url == '/') {
       posredujOsnovnoStran(odgovor);
   } else if (zahteva.url == '/datoteke') { 
       posredujSeznamDatotek(odgovor);
   } else if (zahteva.url.startsWith('/brisi')) { 
       izbrisiDatoteko(odgovor, dataDir + zahteva.url.replace("/brisi", ""));
   } else if (zahteva.url.startsWith('/prenesi')) { 
       posredujStaticnoVsebino(odgovor, dataDir + zahteva.url.replace("/prenesi", ""), "application/octet-stream");
   } else if (zahteva.url == "/nalozi") {
       naloziDatoteko(zahteva, odgovor);
   } else if (zahteva.url.startsWith("/poglej")) {
       posredujStaticnoVsebino(odgovor, dataDir + zahteva.url.replace("/poglej", ""), "");
   } else {
       posredujStaticnoVsebino(odgovor, './public' + zahteva.url, "");
   }
});
streznik.listen(process.env.PORT, function() {
    console.log("Streznik zagnan");
});

function posredujOsnovnoStran(odgovor) {
    posredujStaticnoVsebino(odgovor, './public/fribox.html', "");
}

function posredujStaticnoVsebino(odgovor, absolutnaPotDoDatoteke, mimeType) {
        fs.exists(absolutnaPotDoDatoteke, function(datotekaObstaja) {
            if (datotekaObstaja) {
                fs.readFile(absolutnaPotDoDatoteke, function(napaka, datotekaVsebina) {
                    if (napaka) {
                        //Posreduj napako
                        napaka500(odgovor);
                    } else {
                        posredujDatoteko(odgovor, absolutnaPotDoDatoteke, datotekaVsebina, mimeType);
                    }
                })
            } else {
                napaka404(odgovor);
            }
        })
}

function posredujDatoteko(odgovor, datotekaPot, datotekaVsebina, mimeType) {
    if (mimeType == "") {
        odgovor.writeHead(200, {'Content-Type': mime.lookup(path.basename(datotekaPot))});    
    } else {
        odgovor.writeHead(200, {'Content-Type': mimeType});
    }
    
    odgovor.end(datotekaVsebina);
}

function posredujSeznamDatotek(odgovor) {
    odgovor.writeHead(200, {'Content-Type': 'application/json'});
    fs.readdir(dataDir, function(napaka, datoteke) {
        if (napaka) {
            //Posreduj napako
            napaka500();
        } else {
            var rezultat = [];
            for (var i=0; i<datoteke.length; i++) {
                var datoteka = datoteke[i];
                var velikost = fs.statSync(dataDir+datoteka).size;    
                rezultat.push({datoteka: datoteka, velikost: velikost});
            }
            
            odgovor.write(JSON.stringify(rezultat));
            odgovor.end();      
        }
    })
}

function naloziDatoteko(zahteva, odgovor) {
    var form = new formidable.IncomingForm();
 
    form.parse(zahteva, function(napaka, polja, datoteke) {
        util.inspect({fields: polja, files: datoteke});
    });
 
    form.on('end', function(fields, files) {
        var zacasnaPot = this.openedFiles[0].path;
        var datoteka = this.openedFiles[0].name;
        fs.exists(dataDir+datoteka, function(napaka) {
            if (napaka) {
                odgovor.writeHead(409, {"Content-Type":"text/plain"});
                odgovor.write("Datoteka obstaja!");
                odgovor.end();
            } else {
                fs.copy(zacasnaPot, dataDir + datoteka, function(napaka) {  
                    if (napaka) {
                        //Posreduj napako
                        napaka500(odgovor);
                    } else {
                        posredujOsnovnoStran(odgovor);        
                    }
                });
            }
        });
        
    });
}

function izbrisiDatoteko(odgovor, pot) {
    fs.exists(pot, function(datotekaObstaja) {
        if (datotekaObstaja) {
            fs.unlink(pot, function(napaka) {
                if (napaka) {
                    //Posreduj napako
                    napaka500(odgovor);
                } else {
                    odgovor.writeHead(200, {"Content-Type": "text/plain"});
                    odgovor.write("Datoteka izbrisana");
                    odgovor.end();
                }
            })
        } else {
            napaka404(odgovor);
        }
    });
}

function napaka404(odgovor) {
    odgovor.writeHead(404, {"Content-Type": "text/plain"});
    odgovor.write("Napaka 404. Vira ni mogoce najti.");
    odgovor.end();
}

function napaka500(odgovor) {
    odgovor.writeHead(500, {"Content-Type": "text/plain"});
    odgovor.write("Napaka 500. Tezave na strezniku.");
    odgovor.end();
}