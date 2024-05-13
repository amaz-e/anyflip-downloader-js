        async function extractAndDisplayData() {
            try {
                const fileUrl = document.getElementById('fileUrl').value;
				const preparedURL = prepareURL(fileUrl);
                const configURL = preparedURL + 'mobile/javascript/config.js';
                const configResponse = await fetch(configURL);
                const configData = await configResponse.text();

                const title = extractTitle(configData);
                const filenames = extractFilenames(configData);

                displayTitle(title);
                displayFileUrls(filenames);
            } catch (error) {
                console.error('Error:', error);
            }
        }
		
		function prepareURL(fileUrl) {
			let configURL;
			if (fileUrl.startsWith('https://anyflip.com/')) {
				const parts = fileUrl.split('/');
				const documentId = parts[3];
				const publicationId = parts[4];
				configURL = `https://online.anyflip.com/${documentId}/${publicationId}/`;
			} else {
				configURL = fileUrl;
			}
			return configURL;
		}

        function extractTitle(configData) {
            const regex = /"title":"([^"]+)"/;
            const match = regex.exec(configData);
            return match && match[1] ? match[1] : null;
        }

        function extractFilenames(configData) {
            const regex = /"n":\["([^"]+\.jpg)"/g;
            const matches = [];
            let match;
            while ((match = regex.exec(configData)) !== null) {
                matches.push(match[1]);
            }
            console.log(matches);
            if (matches.length == 0)
            {
                var filenames = prepareFilenameFromURL(); 
                for (var i = 0; i < filenames.length; i++) {
                    matches.push(filenames[i]);
                }
            }
            console.log(matches);   
            return matches;
        }

        function prepareFilenameFromURL(){
            const pageCount = document.getElementById('pageCount').value;
            let jpgURLs = [];
            console.log(pageCount);
            for (let i = 0; i < pageCount; i++) {
                const filename = i+1+".jpg";
                jpgURLs.push(filename);

            }
            console.log(jpgURLs.length);
            return jpgURLs;
        }
        

        function displayTitle(title) {
            const filenameTextarea = document.getElementById('filename');
            filenameTextarea.value = title || 'Title not found';
        }

        function displayFileUrls(filenames) {
            
            const fileUrl = prepareURL(document.getElementById('fileUrl').value);
            const fileUrls = filenames.map(filename => fileUrl + 'files/large/' + filename);
            const fileUrlsTextarea = document.getElementById('fileurls');
            fileUrlsTextarea.value = fileUrls.join('\n');
        }

        async function downloadPDF() {
            try {
                const title = extractTitleFromTextarea();
                const jpgUrls = extractJpgUrlsFromTextarea();
                const progressBar = document.getElementById('progressBar');

                updateProgressBar(progressBar, 0); 

                const jpgBuffers = await fetchAndProcessJpgs(jpgUrls, progressBar);

                updateProgressBar(progressBar, 100); 

                const pdfDoc = await createPDFDocument(jpgBuffers);

                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = title ? title + '.pdf' : 'file.pdf';
                link.click();
                document.getElementById('pageCount').value = null;
            } catch (error) {
                console.error('Error:', error);
            }
        }

        function extractTitleFromTextarea() {
            const filenameTextarea = document.getElementById('filename');
            return filenameTextarea.value;
        }

        function extractJpgUrlsFromTextarea() {
            const fileUrlsTextarea = document.getElementById('fileurls');
            return fileUrlsTextarea.value.split('\n');
        }

        async function fetchAndProcessJpgs(jpgUrls, progressBar) {
            const total = jpgUrls.length;
            let loaded = 0;
            const jpgBuffers = [];

            for (const url of jpgUrls) {
                const response = await fetch(url);
                const buffer = await response.arrayBuffer();
                jpgBuffers.push(buffer);

                loaded++;
                const progress = (loaded / total) * 100; 
                updateProgressBar(progressBar, progress);
            }

            return jpgBuffers;
        }

        async function createPDFDocument(jpgBuffers) {
            const pdfDoc = await PDFLib.PDFDocument.create();
            const total = jpgBuffers.length;
            let loaded = 0;

            for (const buffer of jpgBuffers) {
                const jpgImage = await pdfDoc.embedJpg(buffer);
                const page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);
                page.drawImage(jpgImage, {
                    x: 0,
                    y: 0,
                    width: jpgImage.width,
                    height: jpgImage.height
                });

                loaded++;
                const progress = (loaded / total) * 100; 
                updateProgressBar(progressBar, progress);
            }

            return pdfDoc;
        }

        function updateProgressBar(progressBar, progress) {
            progressBar.value = progress;
        }