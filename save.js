const createFolderOnDrive = (token, nomDuDossier, parentFolderId) => {
    const metadata = {
        name: nomDuDossier,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
    };

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.googleapis.com/drive/v3/files');
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'json';
    xhr.onload = () => {
        const folderId = xhr.response.id;
        console.log('response : ', xhr.response);
        /* Do something with the folder ID */
    };
    xhr.send(JSON.stringify(metadata));
};