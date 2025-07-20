document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt');
    const generateButton = document.getElementById('generate');
    const generatedImage = document.getElementById('generatedImage');

    generateButton.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            alert('Please enter a description');
            return;
        }

        generateButton.disabled = true;
        generateButton.textContent = 'Generating...';

        try {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Use the local image URL for faster loading
            generatedImage.src = data.localImageUrl || data.imageUrl;
            generatedImage.style.display = 'block';
            
            // Log the saved image info
            console.log('Image saved as:', data.filename, 'at', data.savedAt);
        } catch (error) {
            alert('Error generating image: ' + error.message);
        } finally {
            generateButton.disabled = false;
            generateButton.textContent = 'Generate Image';
        }
    });
});
