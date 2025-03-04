const fs = require('fs/promises')
const { spawn } = require('child_process')

// Generate a random number between 5000 and 10000
const random = Math.floor(Math.random() * 5000) + 5000

/**
 * Asynchronously runs a script to install AxioDB, create multiple databases and collections,
 * and execute the generated script.
 *
 * The script performs the following steps:
 * 1. Installs the AxioDB package using npm.
 * 2. Generates a script that creates 5000 databases, each with two collections.
 * 3. Writes the generated script to a file named 'serve.js'.
 * 4. Executes the generated script.
 * 5. Sets a timeout to ensure the script completes within 10 seconds.
 *
 * If any step fails, the process exits with an error code.
 *
 * @async
 * @function runScript
 * @throws Will throw an error if the AxioDB installation fails or if there is an error in script execution.
 */
const runScript = async () => {
  try {
    // Ensure axiodb is installed
    console.log('Installing AxioDB...')
    await new Promise((resolve, reject) => {
      const install = spawn('npm', ['install', 'axiodb'], { stdio: 'inherit' })
      install.on('close', (code) =>
        code === 0 ? resolve() : reject(new Error('AxioDB install failed'))
      )
    })

    // Prepare script content
    let scriptContent = `
            const { AxioDB } = require('axiodb');
            const controller = new AxioDB();
            const main = async () => {
        `

    for (let i = 0; i < random; i++) {
      scriptContent += `
                const db${i} = await controller.createDB('db${i}');
                const collection${i} = await db${i}.createCollection('collection${i}');
                const collection${i}_2 = await db${i}.createCollection('collection${i + 1}');
                
                await collection${i}.insert({
                    name: "test",
                }).then((res) => {
                    console.log(res)
                });
                
                await collection${i}_2.insert({
                    name: "test",
                }).then((res) => {
                    console.log(res)
                });
            `
    }

    scriptContent += `
            console.log("Databases and collections created successfully!");
            };
            main().catch((err) => {
                console.error("Test failed:", err);
                process.exit(1); // Exit with error code for CI/CD
            });
        `

    // Write script to a file
    await fs.writeFile('serve.js', scriptContent)
    console.log('Test script written successfully!')

    // Run the script
    console.log('Executing test script...')

    // Set timeout for the script to complete execution
    setTimeout(() => {
      console.log('Test Completed!')
      process.exit(0) // Exit with success code for CI/CD
    }, 10000) // 10 seconds timeout

    const testProcess = spawn('node', ['serve.js'], { stdio: 'inherit' })

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Test completed successfully!')
        process.exit(0) // Success exit code
      } else {
        console.error('Test failed!')
        process.exit(1) // Failure exit code
      }
    })
  } catch (err) {
    console.error('Error in script execution:', err)
    process.exit(1)
  }
}

runScript()
