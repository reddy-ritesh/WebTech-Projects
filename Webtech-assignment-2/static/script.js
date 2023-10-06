document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search');
    const searchBtn = document.getElementById('searchBtn');


    
    searchForm.addEventListener('reset', clearForm);  
    searchBtn.addEventListener('click', validateAndSearch);

    const clearBtn = document.getElementById('clearButton');
    if(clearBtn) {
        clearBtn.addEventListener('click', clearForm);
    }
});


function validateAndSearch(event) {
    //... Other validations ...

    const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
    const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;

    if (minPrice < 0 || maxPrice < 0) {
        alert("Price values cannot be negative! Please try a value greater than or equal to 0.0");
        event.preventDefault(); 
        return;
    } else if (minPrice > maxPrice) {
        alert("Oops! Minimum price cannot be greater than Maximum price! Please try again.");
        event.preventDefault(); 
        return;
    }

   
}

function clearForm() {
    document.getElementById('results').innerHTML = ''; 
    const detailsContainer = document.getElementById('details-container');
    if(detailsContainer) {
        detailsContainer.style.display = "none";  
    }
}






document.getElementById('search').addEventListener('submit', function (event) {
    event.preventDefault();

    let keyword = document.getElementById('keyword').value;
    let minPrice = document.getElementById('minPrice').value || 0;
    let maxPrice = document.getElementById('maxPrice').value || 100000;

    
    let conditions = Array.from(document.querySelectorAll('.con input[type="checkbox"]:checked'), input => input.value);

   

    console.log("Selected conditions:", conditions);


    let returnAccepted = document.getElementById('returnaccepted').checked;
    let freeShipping = document.getElementById('freeShipping').checked;
    let expeditedShipping = document.getElementById('expeditedShipping').checked;
    let sortBy = document.getElementById('sortBy').value;

    const resultsDiv = document.getElementById('results');
    resultsDiv.style.display = ''
   

    let url = `/search?keyword=${encodeURIComponent(keyword)}&minPrice=${encodeURIComponent(minPrice)}&maxPrice=${encodeURIComponent(maxPrice)}&conditions=${encodeURIComponent(conditions)}&returnAccepted=${encodeURIComponent(returnAccepted)}&freeShipping=${encodeURIComponent(freeShipping)}&expeditedShipping=${encodeURIComponent(expeditedShipping)}&sortBy=${encodeURIComponent(sortBy)}`;

    console.log("Generated URL:", url);


    fetch(url)
        .then(response => response.json())
        .then(data => {
            resultsDiv.innerHTML = '';  

           
            const totalEntries = data.findItemsAdvancedResponse?.[0]?.paginationOutput?.[0]?.totalEntries?.[0] || 0;
            const resultStatement = `<b>${totalEntries} Results found for <i>${keyword}</i></b>`;
            resultsDiv.innerHTML = resultStatement; 

            const items = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0]?.item || [];

            if (items.length === 0) {
                resultsDiv.innerHTML = '';
                resultsDiv.innerHTML += '<p style="font-weight: bold; font-size: 24px;">No Results Found</p>'; 
                return;
            }
            

            const hr = document.createElement("hr")
            resultsDiv.appendChild(hr)


            items.forEach((item, index) => {

                const itemDiv = document.createElement('div');
                itemDiv.className = 'item';

               
                itemDiv.setAttribute('data-item-id', item.itemId[0]);

                itemDiv.style.display = index < 3 ? 'block' : 'none';

                const thumbnailDiv = document.createElement('div');
                thumbnailDiv.className = 'thumbnail';

                const image = document.createElement('img');
                const imageUrl = (item.galleryURL && item.galleryURL.length > 0) ? item.galleryURL[0] : 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg';
                image.src = imageUrl;
                thumbnailDiv.appendChild(image);

                const itemDetailsDiv = document.createElement('div');
                itemDetailsDiv.className = 'item-details';

                const title = document.createElement('h2');
                title.textContent = item.title;
                itemDetailsDiv.appendChild(title); 

                const categoryP = document.createElement('p');
                const category = item.primaryCategory ? item.primaryCategory[0].categoryName[0] : 'N/A';
                categoryP.textContent = 'Category: ' + category;
                itemDetailsDiv.appendChild(categoryP);

                const redirectLink = document.createElement('a');
                if (item.viewItemURL && item.viewItemURL.length > 0) { 
                    redirectLink.href = item.viewItemURL[0]; // 
                } else {
                    redirectLink.href = '#'; 
                    console.warn('Missing viewItemURL for item:', item);
                }
                redirectLink.target = '_blank'; 

                const redirectImage = document.createElement('img');
                redirectImage.src = 'https://csci571.com/hw/hw6/images/redirect.png';
                redirectImage.alt = 'Redirect';
                redirectImage.className = 'redirect-icon';
                redirectLink.appendChild(redirectImage);
                categoryP.appendChild(redirectLink);

              


                const conditionP = document.createElement('p');
                if (item.condition && item.condition[0] && item.condition[0].conditionDisplayName) {
                    conditionP.textContent = 'Condition: ' + item.condition[0].conditionDisplayName[0];
                } else {
                    conditionP.textContent = 'Condition: Not Available'; 
                }
                itemDetailsDiv.appendChild(conditionP);


                if (item.topRatedListing == "true") {
                    const topRatedImage = document.createElement('img');
                    topRatedImage.src = 'https://csci571.com/hw/hw6/images/topRatedImage.png';
                    topRatedImage.alt = 'Top Rated';
                    topRatedImage.className = 'top-rated-icon'; 
                    conditionP.appendChild(topRatedImage); 
                }
                itemDetailsDiv.appendChild(conditionP);



                const itemPrice = parseFloat(item.sellingStatus[0].convertedCurrentPrice[0].__value__);

                let shipCost = 0.00;
                try {
                    shipCost = parseFloat(item.shippingInfo[0].shippingServiceCost[0].__value__);
                } catch (error) {
                    shipCost = 0.00;
                }
                
                const pricePara = document.createElement('p');
                pricePara.className = 'price';
                pricePara.textContent = `Price: $${itemPrice.toFixed(2)}${shipCost >= 0.01 ? ` + $${shipCost.toFixed(2)} for shipping` : ''}`;
                itemDetailsDiv.appendChild(pricePara);                 

                itemDiv.appendChild(thumbnailDiv);
                itemDiv.appendChild(itemDetailsDiv);

                itemDiv.addEventListener('click', function() {
                    
                    const itemId = this.getAttribute('data-item-id');
                    fetchItemDetails(itemId); 
                });
                
                resultsDiv.appendChild(itemDiv);

            });

            if (items.length > 3) {
                const showMoreBtn = document.createElement('button');
                showMoreBtn.innerText = 'Show More';
                showMoreBtn.id = 'showMoreBtn';
                showMoreBtn.className = 'form-button';
                showMoreBtn.addEventListener('click', () => toggleItems(items));
                resultsDiv.appendChild(showMoreBtn);
            }
        })
        .catch(error => {
            resultsDiv.innerHTML = 'Failed to load data. Please try again later.';
            console.error('Error during fetch operation: ', error);
        });
});

function toggleItems(items) {
    const showMoreBtn = document.getElementById('showMoreBtn');
    if (showMoreBtn.innerText === 'Show More') {
        items.forEach((item, index) => {
            if (index < 10) { // Limit the display to a maximum of 10 items
                document.getElementsByClassName('item')[index].style.display = 'block';
            }
        });
        showMoreBtn.innerText = 'Show Less';
    } else {
        items.forEach((item, index) => {
            if (index >= 3) {
                document.getElementsByClassName('item')[index].style.display = 'none';
            }
        });
        showMoreBtn.innerText = 'Show More';
    }
}

function fetchItemDetails(itemId) {
    let url = `/itemDescription?ID=${encodeURIComponent(itemId)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayData(data)
        })
        .catch(error => console.error('Error:', error));
}

function displayData(parsed_data) {
    const results = document.getElementById('results')
    results.style.display = 'none'

    let container = document.createElement('div'); 
    container.id = 'details-container'; 

    let header = document.createElement('h1'); 
    header.textContent = 'Item Details'; 
    container.appendChild(header); 

    let button = document.createElement('button'); 
    button.className = 'form-button'
    button.textContent = 'Back to Search Results'; 
    button.addEventListener('click', function() {
        
        container.style.display = "none"
        results.style.display = ""
    });
    container.appendChild(button); 

    let table = document.createElement('table');
    table.id = "itemTable";
    table.setAttribute('border', '1');

    let tbody = document.createElement('tbody');

    function addRow(key, value) {
        let row = document.createElement('tr');

        let keyCell = document.createElement('td');
        keyCell.textContent = key;
        keyCell.style.fontWeight = 'bold'; 
        keyCell.style.whiteSpace = 'nowrap'; 
        row.appendChild(keyCell);

        let valueCell = document.createElement('td');
        if (key === 'Photo') {
            let img = document.createElement('img');
            img.src = value;
            img.width = 250;  
            valueCell.appendChild(img);
        } else if (key === 'eBay Link') {
            let link = document.createElement('a');
            link.href = value;
            link.textContent = 'eBay Link';
            link.target = '_blank';
            valueCell.appendChild(link);
        } else {
            valueCell.textContent = value;
        }
        row.appendChild(valueCell);

        tbody.appendChild(row);
    }

    addRow('Photo', parsed_data.photo);
    addRow('eBay Link', parsed_data.ebay_link);
    addRow('Title', parsed_data.title);
    addRow('Subtitle', parsed_data.subtitle);
    addRow('Price', parsed_data.price);
    addRow('Location', parsed_data.location);
    addRow('Seller', parsed_data.seller);
    addRow('Return Policy (US)', parsed_data.return_policy_us);

    for (let specific in parsed_data.item_specifics) {
        addRow(specific, parsed_data.item_specifics[specific]);
    }

    table.appendChild(tbody);
    container.appendChild(table); 

   
    document.body.appendChild(container);
}