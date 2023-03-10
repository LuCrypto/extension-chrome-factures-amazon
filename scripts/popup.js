// Permet d'attendre un certain temps en secondes
const delay = (n) => {
    return new Promise(function (resolve) {
        setTimeout(resolve, n);
    });
}

// Pour cliquer sur tous les boutons "Facture"
const generateAllFactures = async () => {

    const allDate = []
    const allOrderCommand = []
    const orderFactures = []

    // Get date and order command
    const allOrders = document.querySelectorAll('#ordersContainer > div[class="a-box-group a-spacing-base order js-order-card"]')

    allOrders.forEach((order) => {
        let spanDate = order.querySelector(' div.a-box.a-color-offset-background.order-info > div > div > div > div.a-fixed-right-grid-col.a-col-left > div > div.a-column.a-span4 > div.a-row.a-size-base > span')
        let spanOrderCommand = order.querySelector('div.a-box.a-color-offset-background.order-info > div > div > div > div.a-fixed-right-grid-col.actions.a-col-right > div.a-row.a-size-mini.yohtmlc-order-id > span.a-color-secondary.value > bdi')
        if (spanDate === null) {
            allDate.push('no-date')
        } else {
            allDate.push(spanDate.textContent)
        }

        if (spanOrderCommand === null) {
            allOrderCommand.push('no-order')
        } else {
            allOrderCommand.push(spanOrderCommand.textContent)
        }
        console.log('spanOrderCommand.textContent :', spanOrderCommand.textContent)
    })

    // =================================================

    const liens = document.querySelectorAll('a');

    console.log('liens avant :', liens.length);
    let numberFinal = liens.length;

    // Parcours de tous les liens de la page
    for (let i = 0; i < liens.length; i++) {
        const lien = liens[i];
        const textContent = lien.textContent;

        // Cliquer sur le bouton "Facture"
        if (textContent.includes('Facture')) {
            console.log('click !')
            lien.click();

            while (document.querySelectorAll('a').length === numberFinal) {
                await delay(300)
                console.log('test')
            }
            await delay(300)
            numberFinal = document.querySelectorAll('a').length;

            // Récupérer les liens des factures
            // TODO

            orderFactures.push({
                date: (allDate[orderFactures.length - 1] === undefined) ? 'no-date' : allDate[orderFactures.length - 1],
                orderCommand: (allOrderCommand[orderFactures.length - 1] === undefined) ? 'no-order' : allOrderCommand[orderFactures.length - 1],
            })
        }
    }

    console.log('orderFactures :', orderFactures)

    console.log('apres')
    console.log('liens après :', document.querySelectorAll('a').length);
}

// Pour récupérer les liens des factures
const getAllLinks = () => {
    const liens = document.querySelectorAll('a');

    console.log('liens :', liens.length);

    // Parcours de tous les liens de la page
    for (let i = 0; i < liens.length; i++) {
        const lien = liens[i];
        const href = lien.getAttribute('href');

        // Vérification si l'attribut href contient la chaîne de caractères "documents/download/" suivie d'un nombre
        if (href !== null && href.includes("documents/download/")) {
            console.log('trouve : ', href);
            let array = JSON.parse(sessionStorage.getItem('consoleLog'));
            if (array === null) {
                array = [];
            }
            array.push(lien.href)
            sessionStorage.setItem('consoleLog', JSON.stringify(array))
        }
    }
}

// Pour télécharger tous les liens dans un zip
const downloadAllUrls = (urls) => {
    if (urls.length === 0) {
        return;
    }

    const pdfs = [];

    Promise.all(urls.map(url =>
        fetch(url)
            .then(response => {
                console.log('response :', response)
                return response.blob()
            })
            .then(blob => pdfs.push(blob))
    )).then(() => {
        // toutes les PDF ont été récupérées avec succès
        // const zip = new JSZip();
        let tokenGoogle = sessionStorage.getItem('tokenGoogle');
        console.log('tokenGoogle :', tokenGoogle)

        pdfs.forEach((pdf, index) => {
            console.log('pdf :', pdf.text)
            // zip.file(`pdf${index + 1}.pdf`, pdf);
            createFileIntoDrive(tokenGoogle, `pdf${index + 1}.pdf`, 'pdf', pdf)
            return
        });

        // zip.generateAsync({ type: 'blob' }).then(zipBlob => {
        //     console.log('FINISH :', zipBlob)

        //     let tokenGoogle = sessionStorage.getItem('tokenGoogle');
        //     console.log('tokenGoogle :', tokenGoogle)
        //     createFileIntoDrive(tokenGoogle, 'mesPdfs.zip', 'zip', zipBlob)
        // le fichier zip a été créé avec succès
        // var url = URL.createObjectURL(zipBlob);
        // var link = document.createElement('a');

        // link.href = url;
        // link.download = 'files.zip';

        // console.log('FINISH :', zipBlob)
        // console.log('FINISH :', url)

        // // Ajout du lien au DOM et clic pour lancer le téléchargement
        // document.body.appendChild(link);
        // link.click();

        // // Suppression du lien du DOM
        // document.body.removeChild(link);
        // });
    });
}

const mainFunction = async () => {
    const arraysButtonsPages = document.querySelectorAll('#ordersContainer > div.a-row > div > ul > li')
    const suivant = arraysButtonsPages[arraysButtonsPages.length - 1]

    // Cliquer sur tous les boutons "Facture"
    await generateAllFactures();

    return

    // Récupération de tous les liens de la page into consoleLog
    getAllLinks();

    // Save all links
    // sessionStorage.setItem('liensDocuments', JSON.stringify(liensDocuments));

    if (document.querySelector('#ordersContainer > div.a-row > div > ul > li.a-disabled.a-last') === null && document.querySelector('#ordersContainer > div.a-row > div > ul') !== null) {
        suivant.querySelector('a').click()
    } else {
        // console.log('avant download :', liensDocuments)
        const arrayLinks = JSON.parse(sessionStorage.getItem('consoleLog'));
        console.log('arrayLinks :', arrayLinks)

        // Téléchargement de tous les liens dans un zip
        downloadAllUrls(arrayLinks);
        sessionStorage.removeItem('consoleLog');
    }
}

const automatic = async () => {
    await delay(10000)
    mainFunction()
}

// Quand on clique sur l'extension
function main(message, sender, sendResponse) {
    console.log("gotMessage : ", message.txt);
    // mainFunction()
}

const createFileIntoDrive = (token, nom, type, fileContent) => {
    console.log('createFileIntoDrive')
    const metadata = {
        name: nom,
        mimeType: 'application/' + type,
        parents: ['19PumY94VDFbYo72PAjOHz5TyBbGdm8Vr'],
    };

    // const file = new Blob([JSON.stringify(fileContent)], { type: 'application/' + type });
    const form = new FormData();

    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileContent);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.responseType = 'json';
    xhr.onload = () => {
        const fileId = xhr.response.id;
        console.log('response 2 : ', xhr.response)

        if (xhr.response.error) {
            console.log('error 3 : ', xhr.response)
            createFileIntoDrive(token, nom, type, fileContent)
        }
        /* Do something with xhr.response */
    };
    xhr.onerror = () => {
        console.log('error 2 : ', xhr.response)
        createFileIntoDrive(token, nom, type, fileContent)

        /* Do something with xhr.response */
    };
    xhr.send(form);
}

// MAIN
console.log('popup.js loaded');

if (sessionStorage.getItem('consoleLog') !== null) {
    automatic()
}

chrome.runtime.onMessage.addListener(gotMessage);

// Quand on clique sur l'extension
function gotMessage(message, sender, sendResponse) {
    // console.log(message.token);
    let tokenGoogle = message.token
    console.log('tokenGoogle 2 :', tokenGoogle)
    sessionStorage.setItem('tokenGoogle', tokenGoogle)
    mainFunction()
}