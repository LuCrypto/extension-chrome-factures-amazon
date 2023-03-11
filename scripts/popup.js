const folderMonth = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];


function retirerEspacesEtRetoursALaLigne(chaine) {
    return chaine.trim().replace(/^[\n\s]+|[\n\s]+$/g, '');
}

// Permet d'attendre un certain temps en secondes
const delay = (n) => {
    return new Promise(function (resolve) {
        setTimeout(resolve, n);
    });
}

// Pour cliquer sur tous les boutons "Facture"
const generateAllFacturesAndGetData = async () => {
    const allDate = []
    const allOrderCommand = []
    const orderFactures = []
    const allOrders = document.querySelectorAll('#ordersContainer > div[class="a-box-group a-spacing-base order js-order-card"]')

    // Get date and order command
    allOrders.forEach((order) => {
        let spanDate = order.querySelector(' div.a-box.a-color-offset-background.order-info > div > div > div > div.a-fixed-right-grid-col.a-col-left > div > div.a-column.a-span4 > div.a-row.a-size-base > span')
        let spanOrderCommand = order.querySelector('div.a-box.a-color-offset-background.order-info > div > div > div > div.a-fixed-right-grid-col.actions.a-col-right > div.a-row.a-size-mini.yohtmlc-order-id > span.a-color-secondary.value > bdi')
        if (spanDate === null) {
            allDate.push('no-date')
        } else {
            allDate.push(retirerEspacesEtRetoursALaLigne(spanDate.textContent))
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
    let oldLenghtForOrder = 0;

    // Parcours de tous les liens de la page
    for (let i = 0; i < liens.length; i++) {
        const lien = liens[i];
        const textContent = lien.textContent;

        // Cliquer sur le bouton "Facture" pour générer la ou les factures
        if (textContent.includes('Facture')) {
            console.log('click !')
            lien.click();

            // Attendre que le lien est généré
            while (document.querySelectorAll('a').length === numberFinal) {
                await delay(300)
                console.log('test')
            }
            await delay(300)
            numberFinal = document.querySelectorAll('a').length;

            const liens = document.querySelectorAll('a');
            console.log('liens :', liens.length);

            let arrayCurrentLink = []
            // Parcours de tous les liens de la page
            for (let j = 0; j < liens.length; j++) {
                const lien = liens[j];
                const href = lien.getAttribute('href');

                // Vérification si l'attribut href contient la chaîne de caractères "documents/download/" suivie d'un nombre
                if (href !== null && href.includes("documents/download/")) {
                    console.log('trouve : ', href);
                    arrayCurrentLink.push(lien.href)
                }
            }

            // console.log('oldLenghtForOrder : ', oldLenghtForOrder)
            // Récupérer les liens des factures de la commande en cours en passant les liens des factures des commandes précédentes
            let onlyInThisScope = []
            for (let index = oldLenghtForOrder; index < arrayCurrentLink.length; index++) {
                onlyInThisScope.push(arrayCurrentLink[index])
            }
            oldLenghtForOrder = arrayCurrentLink.length;
            // console.log('arrayCurrentLink :', arrayCurrentLink)
            // console.log('onlyInThisScope :', onlyInThisScope)

            // Mettre un objet contenant la date, la commande et les liens des factures dans le tableau orderFactures
            orderFactures.push({
                date: (allDate[orderFactures.length] === undefined) ? 'no-date' : allDate[orderFactures.length],
                orderCommand: (allOrderCommand[orderFactures.length] === undefined) ? 'no-order' : allOrderCommand[orderFactures.length],
                arrayLink: onlyInThisScope
            })

        }
    }

    // Save orderFactures in session storage
    // for multi page
    let arrayOldOrder = sessionStorage.getItem('consoleLog')
    if (arrayOldOrder !== null) {
        arrayOldOrder = JSON.parse(arrayOldOrder)
        arrayOldOrder.forEach(element => {
            orderFactures.push(element)
        });
    }

    sessionStorage.setItem('consoleLog', JSON.stringify(orderFactures))
    console.log('orderFactures :', orderFactures)

    console.log('liens après :', document.querySelectorAll('a').length);
}

// Pour télécharger tous les liens dans un zip
const downloadAllUrls = async (arrayObjectData) => {
    if (arrayObjectData.length === 0) {
        return;
    }

    let index = 0;
    let tokenGoogle = sessionStorage.getItem('tokenGoogle');
    console.log('tokenGoogle :', tokenGoogle)

    const arrayFolderId = await getAllFolderId(tokenGoogle)
    console.log('arrayFolderId :', arrayFolderId)

    Promise.all(arrayObjectData.map(bigData =>
        bigData.arrayLink.forEach(url => {
            fetch(url)
                .then(async response => {
                    console.log('response :', response)

                    // get the second string of the bigData.date
                    const date = bigData.date.split(' ')[1]

                    // Find the id for the folder with the date
                    const folderId = arrayFolderId.find(folder => (folder.month.toString().toLowerCase()).localeCompare((date).toString().toLowerCase()) == 0).id
                    console.log('date : ', date)
                    console.log('folderId :', folderId)

                    createFileIntoDrive(tokenGoogle, `pdf-${bigData.date}-${bigData.orderCommand}.pdf`, 'pdf', folderId, await response.blob())
                    index++;
                })
        })
    ))
}

const mainFunction = async () => {
    const arraysButtonsPages = document.querySelectorAll('#ordersContainer > div.a-row > div > ul > li')
    const suivant = arraysButtonsPages[arraysButtonsPages.length - 1]

    // Cliquer sur tous les boutons "Facture" + Récupération de tous les liens de la page, des dates et numéros de commandes into consoleLog
    await generateAllFacturesAndGetData();

    if (document.querySelector('#ordersContainer > div.a-row > div > ul > li.a-disabled.a-last') === null && document.querySelector('#ordersContainer > div.a-row > div > ul') !== null) {
        suivant.querySelector('a').click()
    } else {
        const arrayLinks = JSON.parse(sessionStorage.getItem('consoleLog'));
        console.log('arrayLinks :', arrayLinks)

        downloadAllUrls(arrayLinks);
        sessionStorage.removeItem('consoleLog');
    }
}

const automatic = async () => {
    await delay(7)
    mainFunction()
}

const createFileIntoDrive = (token, nom, type, idFolder, fileContent) => {
    console.log('createFileIntoDrive')
    const metadata = {
        name: nom,
        mimeType: 'application/' + type,
        parents: [idFolder]
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
            createFileIntoDrive(token, nom, type, idFolder, fileContent)
        }
        /* Do something with xhr.response */
    };
    xhr.onerror = () => {
        console.log('error 2 : ', xhr.response)
        createFileIntoDrive(token, nom, type, idFolder, fileContent)

        /* Do something with xhr.response */
    };
    xhr.send(form);
}

const createFolder = (token, nameFolder) => {
    return new Promise((resolve, reject) => {
        var url = 'https://www.googleapis.com/drive/v3/files';

        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                // console.log('BONJOUR', xhr.responseText);
                resolve(JSON.parse(xhr.responseText).id);
            } else {
                console.log('Erreur lors de la création du dossier');
            }
        };

        var data = JSON.stringify({
            'name': nameFolder,
            'mimeType': 'application/vnd.google-apps.folder'
        });

        xhr.send(data);
    })
}

const findFolder = (token, nameFolder) => {
    return new Promise((resolve, reject) => {
        var url = 'https://www.googleapis.com/drive/v3/files';
        url += '?q=name="' + nameFolder + '" and mimeType="application/vnd.google-apps.folder"';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                var files = response.files;

                if (files.length > 0) {
                    console.log('ID du dossier: ' + files[0].id);
                    // console.log('Dossier: ', files[0])
                    // console.log('all : ', files)
                    resolve(files[0].id);
                } else {
                    console.log('Aucun dossier trouvé avec ce nom.');
                    resolve(null);
                }
            } else {
                console.log('Erreur lors de la récupération du dossier.');
                // reject(new Error('Erreur lors de la récupération du dossier.'));
            }
        };

        xhr.send();
    })
}

const findFile = (token, fileName) => {
    return new Promise((resolve, reject) => {
        var url = 'https://www.googleapis.com/drive/v3/files';
        url += '?q=name="' + fileName + '" and mimeType!="application/vnd.google-apps.folder"';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var response = JSON.parse(xhr.responseText);
                    var files = response.files;

                    if (files.length > 0) {
                        console.log('ID du fichier: ' + files[0].id);
                        console.log('Fichier: ', files[0])
                        console.log('all : ', files)
                        resolve('Bonjour');
                    } else {
                        console.log('Aucun fichier trouvé avec ce nom.');
                        resolve('Salut');
                    }
                } else {
                    console.log('Erreur lors de la récupération du fichier.');
                    reject(new Error('Erreur lors de la récupération du fichier.'));
                }
            }
        };

        xhr.send();
    });
};

// Exemple d'utilisation
findFile('mon-token', 'mon-fichier')
    .then((value) => {
        console.log(value); // Output: Bonjour ou Salut
    })
    .catch((error) => {
        console.log(error.message);
    });

const getAllFolderId = async (token) => {
    const arrayData = []

    for (let i = 0; i < folderMonth.length; i++) {
        let month = folderMonth[i]

        let myId = await findFolder(token, month)
        if (myId == null) {
            myId = await createFolder(token, month)
        }

        const object = {
            month: month,
            id: myId
        }

        arrayData.push(object)
    }

    return arrayData
}

// MAIN
console.log('popup.js loaded');

if (sessionStorage.getItem('consoleLog') !== null) {
    automatic()
}

chrome.runtime.onMessage.addListener(gotMessage);

// Quand on clique sur l'extension
async function gotMessage(message, sender, sendResponse) {
    // console.log(message.token);
    let tokenGoogle = message.token
    console.log('tokenGoogle 2 :', tokenGoogle)
    sessionStorage.setItem('tokenGoogle', tokenGoogle)
    mainFunction()
    // createFolder('janvier', tokenGoogle)
    // createFolder(tokenGoogle)
    // let value = await createFolder(tokenGoogle, 'bnojour')

    // const array = await getAllFolderId(tokenGoogle)
    // console.log('array :', array)
}