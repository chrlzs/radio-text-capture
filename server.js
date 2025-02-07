const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Endpoint to capture and decode text
app.post('/capture', (req, res) => {
    const { frequency } = req.body;

    if (!frequency) {
        return res.status(400).json({ error: 'Frequency is required' });
    }

    const outputFile = 'capture.iq';

    // Step 1: Capture the signal using hackrf_transfer
    const captureCommand = `hackrf_transfer -r ${outputFile} -f ${frequency} -s 2000000 -n 20000000`;
    exec(captureCommand, (captureError, captureStdout, captureStderr) => {
        if (captureError) {
            console.error(`Capture error: ${captureStderr}`);
            return res.status(500).json({ error: 'Failed to capture signal' });
        }

        // Step 2: Decode the signal using multimon-ng
        const decodeCommand = `multimon-ng -a AFSK1200 -t raw ${outputFile}`;
        exec(decodeCommand, (decodeError, decodeStdout, decodeStderr) => {
            if (decodeError) {
                console.error(`Decode error: ${decodeStderr}`);
                return res.status(500).json({ error: 'Failed to decode signal' });
            }

            // Step 3: Send the decoded text as the response
            res.json({ text: decodeStdout });

            // Clean up: Delete the captured file
            fs.unlinkSync(outputFile);
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});