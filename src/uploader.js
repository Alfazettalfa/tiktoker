const {upload} = require('youtube-videos-uploader');
const credentials = { email: 'verionsync@gmail.com', pass: 'scheissakw'}

const video1 = {
    path: 'sample.mp4',
    title: 'OJA', 
    description: ''
}

upload(credentials, [video1], {headless:false}).then(console.log)