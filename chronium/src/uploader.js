const {upload} = require('youtube-videos-uploader');
const credentials = { email: 'verionsync@gmail.com', pass: ''}

const video1 = {
    path: 'sample.mp4',
    title: 'OJA', 
    description: ''
}

module.exports = {
    upload: video => {
        return new Promise(resolve => {
            upload(credentials, [video], {headless:false}).then(data => {
                console.log(data);
                resolve(data)
            })
        })
    }
}
