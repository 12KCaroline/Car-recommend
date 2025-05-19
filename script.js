document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('preferencesForm');
    const resultContainer = document.getElementById('resultContainer');
    const carList = document.getElementById('carList');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('errorMessage');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // API key is hardcoded
        const apiKey = "AIzaSyCRluMC9hKzLhCvgHDm2MM0aVsyTZyRN6Y";
        
        // Get all form values
        const priceRange = document.getElementById('priceRange').value;
        const fuelType = document.getElementById('fuelType').value;
        const seatingCapacity = document.getElementById('seatingCapacity').value;
        const carType = document.getElementById('carType').value;
        const brand = document.getElementById('brand').value;
        const transmission = document.getElementById('transmission').value;
        const engineSize = document.getElementById('engineSize').value;
        const safetyFeatures = document.getElementById('safetyFeatures').value;
        const reviews = document.getElementById('reviews').value;
        const performance = document.getElementById('performance').value;
        
        // Check if at least 3 preferences are selected
        const preferences = [priceRange, fuelType, seatingCapacity, carType, brand, transmission, engineSize, safetyFeatures, reviews, performance];
        const selectedPreferences = preferences.filter(pref => pref !== '');
        
        if (selectedPreferences.length < 3) {
            showError('Please select at least 3 preferences');
            return;
        }
        
        // Show loading indicator
        loader.style.display = 'block';
        resultContainer.style.display = 'none';
        errorMessage.style.display = 'none';
        
        try {
            // Create the prompt for Gemini API
            const prompt = `
            I need recommendations for cars available in the Philippines based on these preferences:
            ${priceRange ? `- Price Range: ${priceRange}` : ''}
            ${fuelType ? `- Fuel Type: ${fuelType}` : ''}
            ${seatingCapacity ? `- Seating Capacity: ${seatingCapacity}` : ''}
            ${carType ? `- Car Type/Body Style: ${carType}` : ''}
            ${brand ? `- Brand: ${brand}` : ''}
            ${transmission ? `- Transmission: ${transmission}` : ''}
            ${engineSize ? `- Engine Size/Power: ${engineSize}` : ''}
            ${safetyFeatures ? `- Safety Features: ${safetyFeatures}` : ''}
            ${reviews ? `- Preferred Rating: ${reviews}` : ''}
            ${performance ? `- Performance: ${performance}` : ''}
            
            Please suggest 5 or more specific car models that match these preferences. For each car, provide:
            1. Car name (model and variant)
            2. Price in PHP
            3. Key specifications (engine, transmission, fuel economy)
            4. Special features
            5. Brief description of why it matches my preferences
            
            Format the response as a JSON array with objects for each car containing these fields:
            name, price, engineSpecs, transmission, fuelEconomy, features, matchReason
            `;
            
            // Call the Gemini API with gemini-2.0-flash model
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=' + apiKey, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'Error calling Gemini API');
            }
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].text) {
                throw new Error('Invalid response from Gemini API');
            }
            
            const responseText = data.candidates[0].content.parts[0].text;
            
            // Extract JSON from the response text
            let carData;
            try {
                // Try to find JSON in the response
                const jsonMatch = responseText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    carData = JSON.parse(jsonMatch[0]);
                } else {
                    // If no JSON array is found, try to parse the entire response
                    carData = JSON.parse(responseText);
                }
            } catch (jsonError) {
                console.error('Error parsing JSON from response:', jsonError);
                console.log('Response text:', responseText);
                
                // If parsing fails, try to extract structured data from text
                carData = extractCarsFromText(responseText);
            }
            
            if (!carData || !Array.isArray(carData) || carData.length === 0) {
                throw new Error('Could not extract car recommendations from the response');
            }
            
            // Display results
            displayResults(carData);
            
        } catch (error) {
            console.error('Error:', error);
            showError(error.message || 'An error occurred while fetching recommendations');
        } finally {
            loader.style.display = 'none';
        }
    });
    
    function extractCarsFromText(text) {
        // Fallback function to extract car data from text response
        const cars = [];
        
        // Split by numbered sections (1., 2., etc.)
        const sections = text.split(/\d+\.\s+/);
        
        for (let i = 1; i < sections.length; i++) {
            const section = sections[i].trim();
            if (!section) continue;
            
            // Try to extract car name from the first line
            const lines = section.split('\n');
            const name = lines[0].replace(/\*\*/g, '').trim();
            
            // Extract price if available
            let price = 'Price not specified';
            const priceMatch = section.match(/(?:Price|PHP|₱)[:\s]*([\d,]+)/i);
            if (priceMatch) {
                price = '₱' + priceMatch[1];
            }
            
            // Create a simple car object
            cars.push({
                name: name,
                price: price,
                engineSpecs: 'Details not available',
                transmission: 'Details not available',
                fuelEconomy: 'Details not available',
                features: 'Details not available',
                matchReason: section
            });
        }
        
        return cars;
    }
    
    function displayResults(cars) {
        carList.innerHTML = '';
        
        cars.forEach(car => {
            const carCard = document.createElement('div');
            carCard.className = 'car-card';
            
            // Create placeholder image URL
            const placeholderImage = '/api/placeholder/300/160';
            
            carCard.innerHTML = `
                <img src="${placeholderImage}" alt="${car.name}" class="car-image">
                <h3 class="car-title">${car.name}</h3>
                <p class="car-price">${car.price}</p>
                <div class="car-details">
                    <p class="detail-item"><strong>Engine:</strong> ${car.engineSpecs || 'N/A'}</p>
                    <p class="detail-item"><strong>Transmission:</strong> ${car.transmission || 'N/A'}</p>
                    <p class="detail-item"><strong>Fuel Economy:</strong> ${car.fuelEconomy || 'N/A'}</p>
                    <p class="detail-item"><strong>Features:</strong> ${car.features || 'N/A'}</p>
                    <p class="detail-item"><strong>Why it matches:</strong> ${car.matchReason || 'N/A'}</p>
                </div>
            `;
            
            carList.appendChild(carCard);
        });
        
        resultContainer.style.display = 'block';
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        loader.style.display = 'none';
    }
});