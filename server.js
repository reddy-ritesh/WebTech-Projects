const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();



const path = require('path');

const APP_ID = 'RiteshRe-webtech-PRD-4af878574-2bd628dd';
const CLIENT_ID = 'RiteshRe-webtech-PRD-4af878574-2bd628dd';
const CLIENT_SECRET = 'PRD-af8785745f8d-3dd0-4744-bf74-3ba4';
const GOOGLE_API_KEY = 'AIzaSyC9NKWKFUbq_tARoYKP70PXpOSCFCXOJeY';
const GOOGLE_CSE_ID = 'f79384880d7664c21';


app.use(cors());


app.use(cors({ origin: 'http://localhost:4200' }));



const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');


app.use(bodyParser.json());

const username = 'riteshreddy99'; // Replace with your username
const password = encodeURIComponent('BPJ#siS4#QtApec?');
const dbName = 'HW3'; // Replace with your database name

// MongoDB URI
const uri = `mongodb+srv://${username}:${password}@cluster0.gdherfa.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

// Connect to MongoDB
async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("Connected successfully to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}

connectToMongoDB();

// Add to Wishlist Endpoint
app.get('/addToWishlist', async (req, res) => {
    try {
        const { itemId, title, image, condition, postalCode, shipping, price } = req.query;
        if (!itemId || !title || !image || !condition || !postalCode || !shipping || !price) {
            return res.status(400).send("All parameters (itemId, title, image, condition, postalCode, shipping, price) are required");
        }

        const db = client.db("HW3");
        const collection = db.collection("favorites");
        
        await collection.insertOne({
            itemId: itemId,
            title: title,
            image: image,
            condition: condition,
            postalCode: postalCode,
            shipping: shipping,
            price: price  // Including price in the database document
        });

        res.status(200).send("Item added to wishlist");
    } catch (error) {
        res.status(500).send("Error adding item to wishlist");
    }
});




// Remove from Wishlist Endpoint
app.get('/removeFromWishlist', async (req, res) => {
    try {
        const itemId = req.query.itemId;
        if (!itemId) {
            return res.status(400).send("Item ID is required");
        }

        const db = client.db("HW3");
        const collection = db.collection("favorites");
        
        await collection.deleteOne({ itemId: itemId });

        res.status(200).send("Item removed from wishlist");
    } catch (error) {
        res.status(500).send("Error removing item from wishlist");
    }
});



app.get('/getWishlistItems', async (req, res) => {
    try {
        const db = client.db("HW3");
        const collection = db.collection("favorites");

        const items = await collection.find({}).toArray();

        res.status(200).json(items);
    } catch (error) {
        res.status(500).send("Error fetching items from wishlist");
    }
});


  





// app.use(express.static(path.join(__dirname, 'dist/angular-bootstrap-examples')))

// app.get('*', function (req, res) {
//     res.sendFile(path.join(__dirname, 'dist/angular-bootstrap-examples'))
// });

async function findItemsAdvanced(keywords, categoryId, conditionValues, localPickup, freeShipping, distance, buyerPostalCode, page = 1, entriesPerPage = 10) {
    const endpoint = `https://svcs.ebay.com/services/search/FindingService/v1`;

    const unspecifiedIndex = conditionValues.indexOf('Unspecified');
    const hasUnspecified = unspecifiedIndex !== -1;
    const params = {
        'OPERATION-NAME': 'findItemsAdvanced',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': APP_ID,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': true,
        'keywords': keywords,
        'paginationInput.entriesPerPage': entriesPerPage,
        'paginationInput.pageNumber': page,
        'timestamp': new Date().getTime(),
        'buyerPostalCode': buyerPostalCode
    };

    if (categoryId) {
        params[`categoryId`] = categoryId
    }

    if (hasUnspecified) {
        // Remove "Unspecified" from the array to prevent adding it as a filter
        conditionValues.splice(unspecifiedIndex, 1);
    }

    params[`itemFilter(0).name`] = 'MaxDistance'
    params[`itemFilter(0).value(0)`] = distance

    if (conditionValues.length > 0) {
        params[`itemFilter(1).name`] = 'Condition';
        conditionValues.forEach((condition, index) => {
            params[`itemFilter(1).value(${index})`] = condition;
        })


    }

    // Initialize filterIndex after condition filters have been added or start from 0
    let filterIndex = conditionValues.length > 0 ? 2 : 1;

    // Append local pickup filter if it is true
    if (localPickup) {
        params[`itemFilter(${filterIndex}).name`] = 'LocalPickupOnly';
        params[`itemFilter(${filterIndex}).value(0)`] = 'true';
        filterIndex++;
    }

    // Append free shipping filter if it is true
    if (freeShipping) {
        params[`itemFilter(${filterIndex}).name`] = 'FreeShippingOnly';
        params[`itemFilter(${filterIndex}).value(0)`] = 'true';
        filterIndex++; // Incrementing filter index
    }

    console.log(params)


    try {
        const response = await axios.get(endpoint, { params });
        const searchResults = response.data.findItemsAdvancedResponse[0].searchResult[0];
        const items = searchResults.item || [];
        const paginationOutput = response.data.findItemsAdvancedResponse[0].paginationOutput[0];

        // Return a structured object with separate items and pagination details
        return {
            items: items.map(item => ({
                condition: item.condition[0],
                itemId: item.itemId[0],
                title: item.title[0],
                price: item.sellingStatus[0].currentPrice[0].__value__,
                galleryURL: item.galleryURL && item.galleryURL[0],  // Check for existence before accessing
                postalCode: item.postalCode ? item.postalCode[0] : "N/A",
                viewItemURL: item.viewItemURL ? item.viewItemURL[0] : "N/A",
                shippingInfo: {
                    shippingServiceCost: item.shippingInfo[0].shippingServiceCost
                        ? parseFloat(item.shippingInfo[0].shippingServiceCost[0].__value__)
                        : null,
                    shipToLocations: item.shippingInfo[0].shipToLocations
                        ? item.shippingInfo[0].shipToLocations
                        : [],
                    handlingTime: item.shippingInfo[0].handlingTime
                        ? item.shippingInfo[0].handlingTime[0]
                        : null,
                    expeditedShipping: item.shippingInfo[0].expeditedShipping
                        ? item.shippingInfo[0].expeditedShipping[0] === 'true'
                        : false,
                    oneDayShippingAvailable: item.shippingInfo[0].oneDayShippingAvailable
                        ? item.shippingInfo[0].oneDayShippingAvailable[0] === 'true'
                        : false,

                },
                returnsAccepted: item.returnsAccepted
                    ? item.returnsAccepted[0] === 'true'
                    : false,

            })),
            pageNumber: parseInt(paginationOutput.pageNumber[0]),
            totalPages: parseInt(paginationOutput.totalPages[0]),
            totalEntries: parseInt(paginationOutput.totalEntries[0])
        };
    } catch (error) {
        console.error('Error calling eBay API:', error);
        // Return an object with empty items and default pagination details
        return {
            items: [],
            pageNumber: page,
            totalPages: 0,
            totalEntries: 0
        };
    }
}

app.get('/autocomplete', async (req, res) => {

try {
const response = await axios.get('http://api.geonames.org/postalCodeSearchJSON?', { params: {
postalcode_startsWith: req.query.zip,
maxRows: '5',
country: 'US',
   username: 'reddy.ritesj', // Replace with your Geonames API username
  },
   });
    
 const responseData = response.data;
  // Extract postal codes
const postalCodes = responseData.postalCodes.map(entry => entry.postalCode)
res.json(postalCodes)
} catch (error) {
console.error(error);
res.status(500).json({ error: 'An error occurred while fetching postal codes' });
}
    });


// Setting up the endpoint
app.get('/search', async (req, res) => {
    const keywords = req.query.keywords || '';
    const categoryId = req.query.categoryId;
    const conditionValues = req.query.condition ? req.query.condition.split(',') : [];
    const localPickup = req.query.localPickup === 'true';
    const freeShipping = req.query.freeShipping === 'true';

    const distance = req.query.distance || '10';
    const buyerPostalCode = req.query.buyerPostalCode;

    const page = parseInt(req.query.page) || 1;
    const entriesPerPage = parseInt(req.query.entriesPerPage) || 10;

    try {
        const { items, pageNumber, totalPages, totalEntries } = await findItemsAdvanced(keywords, categoryId, conditionValues, localPickup, freeShipping, distance,
            buyerPostalCode, page, entriesPerPage);
        // Send the structured response with separate items and pagination details
        res.json({
            items,
            pageNumber,
            totalPages,
            totalEntries
        });
    } catch (error) {
        console.error('Error calling the findItemsAdvanced function:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



// Function to encode your client credentials and get an OAuth token
async function getOAuthToken() {
    const endpoint = "https://api.ebay.com/identity/v1/oauth2/token";
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
    };

    const data = 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope';

    try {
        const response = await axios.post(endpoint, data, { headers });
        return response.data.access_token;
    } catch (error) {
        console.error('Error obtaining OAuth token:', error);
        throw new Error('OAuth token retrieval failed');
    }
}

async function searchImagesWithGoogle(query) {
    const imgSize = 'huge';
    const num = 8; // Adjust the number of images as needed
    const searchType = 'image';
    const googleApiUrl = 'https://www.googleapis.com/customsearch/v1';

    try {
        const response = await axios.get(googleApiUrl, {
            params: {
                q: query,
                cx: GOOGLE_CSE_ID,
                imgSize,
                num,
                searchType,
                key: GOOGLE_API_KEY,
            }
        });
        return response.data.items.map(item => ({
            link: item.link,
            thumbnail: item.image.thumbnailLink,
        }));
    } catch (error) {
        console.error('Error fetching images from Google:', error);

        // Check and log detailed error response
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error data:', error.response.data);
            console.error('Error status:', error.response.status);
            console.error('Error headers:', error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Error request:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
        }

        throw error; // throw the original error to be handled by the caller
    }
}



app.get('/search/photos', async (req, res) => {
    const query = req.query.q;
    try {
        const imageLinks = await searchImagesWithGoogle(query);
        res.json(imageLinks);
    } catch (error) {
        // Adding detailed logging here can help diagnose the issue
        console.error('Error in /search/photos endpoint:', error);
        if (error.response) {
            // Respond with the actual error message from Google API if available
            res.status(500).send(error.response.data);
        } else {
            res.status(500).send('Internal Server Error');
        }
    }
});


async function getSingleItem(itemId) {
    const endpoint = 'https://open.api.ebay.com/shopping';
    const accessToken = await getOAuthToken(); // Fetch the token right before the call

    const headers = {
        'X-EBAY-API-IAF-TOKEN': accessToken
    };

    const params = {
        callname: 'GetSingleItem',
        version: '967',
        responseencoding: 'JSON',
        siteid: '0',
        ItemID: itemId,
        IncludeSelector: 'Details,ItemSpecifics,ShippingCosts,Seller'
    };

    try {
        const response = await axios.get(endpoint, { params: params, headers: headers });
        const item = response.data.Item;
        // Extract the required fields from the response data.
        const itemDetails = {
            productId: item.ItemID,
            title: item.Title,
            pictureUrls: item.PictureURL,
            price: item.CurrentPrice.Value,
            location: item.Location,
            returnPolicy: {
                returnsAccepted: item.ReturnPolicy ? item.ReturnPolicy.ReturnsAccepted : undefined,
                returnsWithin: item.ReturnPolicy ? item.ReturnPolicy.ReturnsWithin : undefined,
            },
            itemSpecifics: item.ItemSpecifics ? item.ItemSpecifics.NameValueList : [],
            shippingCost: item.ShippingCostSummary ? item.ShippingCostSummary.ShippingServiceCost.Value : undefined,
            seller: {
                feedbackScore: item.Seller.FeedbackScore,
                popularity: item.Seller.PositiveFeedbackPercent,
                feedbackRatingStar: item.Seller.FeedbackRatingStar,
                topRated: item.Seller.TopRatedSeller,
                storeName: item.Storefront ? item.Storefront.StoreName : undefined,
                buyProductAt: item.Storefront ? item.Storefront.StoreURL : undefined
            }
        };

        // Now we will search for images using the product title
        //    const imageLinks = await searchImagesWithGoogle(itemDetails.title);
        //    itemDetails.googleImageLinks = imageLinks; // Add image links to the details

        return itemDetails;
    } catch (error) {
        console.error('Error calling GetSingleItem API:', error);
        throw new Error('GetSingleItem API call failed');
    }
}

// Route to handle the GetSingleItem API call
app.get('/item/:itemId', async (req, res) => {
    const itemId = req.params.itemId;

    try {
        const itemDetails = await getSingleItem(itemId);
        res.json(itemDetails);
    } catch (error) {
        console.error('Error in /item/:itemId endpoint:', error);
        res.status(500).send('Internal Server Error');
    }
});




// This function will call the eBay Merchandising API to get similar items
async function getSimilarItems(itemId, maxResults = 20) {
    const endpoint = `https://svcs.ebay.com/MerchandisingService`;
    const params = {
        'OPERATION-NAME': 'getSimilarItems',
        'SERVICE-NAME': 'MerchandisingService',
        'SERVICE-VERSION': '1.1.0',
        'CONSUMER-ID': APP_ID,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': true,
        'itemId': itemId,
        'maxResults': maxResults
    };

    try {
        const response = await axios.get(endpoint, { params });
        const similarItems = response.data.getSimilarItemsResponse.itemRecommendations.item || [];

        return similarItems.map(item => {
            return {
                itemId: item.itemId,
                productName: item.title,
                viewItemURL: item.viewItemURL,
                price: item.buyItNowPrice ? item.buyItNowPrice.__value__ : 'N/A',
                shippingCost: item.shippingCost ? item.shippingCost.__value__ : 'N/A',
                daysLeft: item.timeLeft ? item.timeLeft.match(/P(\d+)D/)[1] : 'N/A',
                imageURL: item.imageURL || 'N/A' // Use the imageURL from the response
            };
        });
    } catch (error) {
        console.error('Error calling eBay Merchandising API:', error);
        throw error;
    }
}

// Endpoint to get similar products
app.get('/similar-products', async (req, res) => {
    const itemId = req.query.itemId;
    const maxResults = parseInt(req.query.maxResults) || 20;

    try {
        const items = await getSimilarItems(itemId, maxResults);
        res.json(items);
    } catch (error) {
        console.error('Error calling the getSimilarItems function:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



const PORT = process.env.PORT || 3000;
app.use(express.static("./dist/angular-bootstrap-examples"));
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
