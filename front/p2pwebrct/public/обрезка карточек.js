const sharp = require('sharp');
   const fs = require('fs');
   const path = require('path');

   const directoryPath = path.join(__dirname,'imagesdoors');
   const outputDirectoryPath = path.join(__dirname, 'outputdoors');

   fs.readdir(directoryPath, function(err, files) {
     if (err) {
       return console.log('Unable to scan directory: ' + err);
     }
     files.forEach(function(file) {
       // ensure file is an image
       if (!file.match(/\.(png|jpg|jpeg|gif)$/i)) {
         return;
       }

       // read the image
       const inputFilePath = path.join(directoryPath, file);
       sharp(inputFilePath)
         // crop the image to a circle with a 16px radius
         .resize(256, 256, {
           fit: 'cover',
           position: 'entropy',
         })
         .flatten({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
         .composite([
           {
             input: Buffer.from(`<svg><circle cx="128" cy="128" r="128" fill="none" stroke="#ffffff" stroke-width="32"/></svg>`),
             blend: 'dest-in'
           },
         ])
         // save the image as a PNG file
         .toFile(path.join(outputDirectoryPath, file.replace(/\.(png|jpg|jpeg|gif)$/i, '.png')), (err) => {
           if (err) {
             console.log(`Error processing image ${file}: ${err}`);
           }
         });
     });
   });