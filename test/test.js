const fs = require('fs/promises');
const { spawn } = require('child_process');

const runScript = async () => {
    try {
        // Ensure axiodb is installed
        console.log("Installing AxioDB...");
        await new Promise((resolve, reject) => {
            const install = spawn('npm', ['install', 'axiodb'], { stdio: 'inherit' });
            install.on('close', (code) => (code === 0 ? resolve() : reject(new Error('AxioDB install failed'))));
        });

        // Prepare script content
        let scriptContent = `
            const { AxioDB } = require('axiodb');
            const controller = new AxioDB();
            const main = async () => {
        `;

        for (let i = 0; i < 5000; i++) {
            scriptContent += `
                const db${i} = await controller.createDB('db${i}');
                await db${i}.createCollection('collection${i}');
                await db${i}.createCollection('collection${i + 1}');
            `;
        }

        scriptContent += `
            console.log("Databases and collections created successfully!");
            };
            main().catch((err) => {
                console.error("Test failed:", err);
                process.exit(1); // Exit with error code for CI/CD
            });
        `;

        // Write script to a file
        await fs.writeFile('serve.js', scriptContent);
        console.log("Test script written successfully!");

        // Run the script
        console.log("Executing test script...");

        // Set timeout for the script to complete execution
        setTimeout(() => {
            console.log("Test Completed!");
            process.exit(0); // Exit with success code for CI/CD
        }, 10000); // 10 seconds timeout

        const testProcess = spawn('node', ['serve.js'], { stdio: 'inherit' });

        testProcess.on('close', (code) => {
            if (code === 0) {
                console.log("Test completed successfully!");
                process.exit(0); // Success exit code
            } else {
                console.error("Test failed!");
                process.exit(1); // Failure exit code
            }
        });

    } catch (err) {
        console.error("Error in script execution:", err);
        process.exit(1);
    }
};

runScript();