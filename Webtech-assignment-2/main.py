import json
from flask import Flask, request, send_from_directory, jsonify
from ebay_oauth_token import OAuthToken
import requests

app = Flask(__name__, static_url_path='', static_folder='static')
client_id = 'RiteshRe-webtech-PRD-4af878574-2bd628dd'
client_secret = 'PRD-af8785745f8d-3dd0-4744-bf74-3ba4'

APP_ID = "RiteshRe-webtech-PRD-4af878574-2bd628dd"

@app.route('/')
def home():
    return send_from_directory('static', 'index.html')

sort_order_map = {
    'bestMatch': 'BestMatch',
    'highestPrice': 'CurrentPriceHighest',
    'highestPriceShipping': 'PricePlusShippingHighest',
    'lowestPriceShipping': 'PricePlusShippingLowest'
}




@app.route('/search', methods=['GET'])
def search():
    keyword = request.args.get('keyword')
    min_price = request.args.get('minPrice')
    max_price = request.args.get('maxPrice')
    conditions = request.args.get('conditions').split(",") if request.args.get('conditions') else []
    return_accepted = request.args.get('returnAccepted') == 'true'
    free_shipping = request.args.get('freeShipping') == 'true'
    expedited_shipping = request.args.get('expeditedShipping') == 'true'
    sort_by = request.args.get('sortBy')
    ebay_sort_order = sort_order_map.get(sort_by, 'BestMatch')  
    results = items_ebay(keyword, min_price, max_price, conditions, return_accepted, free_shipping, expedited_shipping, ebay_sort_order)
    return jsonify(results)

def items_ebay(keyword, min_price, max_price, conditions, return_accepted, free_shipping, expedited_shipping, sort_by):
    endpoint = 'https://svcs.ebay.com/services/search/FindingService/v1'

    params = {
        'OPERATION-NAME': 'findItemsAdvanced',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': APP_ID,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': '',
        'keywords': keyword,
        'sortOrder': sort_by
    }

    item_filters = []
    filter_count = 0
    if min_price:
        params[f'itemFilter({filter_count}).name'] = 'MinPrice'
        params[f'itemFilter({filter_count}).value'] = min_price
        filter_count += 1

    if max_price:
        params[f'itemFilter({filter_count}).name'] = 'MaxPrice'
        params[f'itemFilter({filter_count}).value'] = max_price
        filter_count += 1
    
    if conditions:  
        params[f'itemFilter({filter_count}).name'] = 'Condition'
        for i, condition in enumerate(conditions):
            params[f'itemFilter({filter_count}).value({i})'] = condition
        filter_count += 1

    if return_accepted:
        item_filters.append({'name': 'ReturnsAcceptedOnly', 'value': 'true'})
    
    if free_shipping:
        item_filters.append({'name': 'FreeShippingOnly', 'value': 'true'})
    
    if expedited_shipping:
        item_filters.append({'name': 'ExpeditedShippingType', 'value': 'Expedited'})


    for i, filter in enumerate(item_filters):
        for key, value in filter.items():
            params[f'itemFilter({i}).{key}'] = value

    print(params)
    
    response = requests.get(endpoint, params=params)
    if response.status_code == 200:
        print(response.json())
        return response.json()
    else:
        return {'error': response.text}


@app.route('/itemDescription', methods=['GET'])
def itemDescription():
    results = getsingleItem(request.args.get('ID'))   
    data = results

    parsed_data = {
        "photo": data["Item"]["PictureURL"][0] if data["Item"].get("PictureURL") else None,
        "ebay_link": data["Item"]["ViewItemURLForNaturalSearch"] if data["Item"].get("ViewItemURLForNaturalSearch") else None,
        "title": data["Item"]["Title"] if data["Item"].get("Title") else None,
        "subtitle": data["Item"]["Subtitle"] if data["Item"].get("Subtitle") else None,
        "price": data["Item"]["CurrentPrice"]["Value"] if data["Item"].get("CurrentPrice") else None,
        "location": data["Item"]["Location"] if data["Item"].get("Location") else None,
        "seller": data["Item"]["Seller"]["UserID"] if data["Item"].get("Seller") else None,
        "return_policy_us": data["Item"]["ReturnPolicy"]["ReturnsAccepted"] if data["Item"].get("ReturnPolicy") else None,
        "item_specifics": {nv["Name"]: nv["Value"] for nv in data["Item"]["ItemSpecifics"]["NameValueList"]} if data["Item"].get("ItemSpecifics") else None,
    }

    return(parsed_data)


def getsingleItem(ItemID):
    endpoint = 'https://open.api.ebay.com/shopping?'

  
    oauth_utility = OAuthToken(client_id, client_secret)

 
    application_token = oauth_utility.getApplicationToken()

    headers = {
    'X-EBAY-API-IAF-TOKEN': application_token
    }

    params = {
    'callname': 'GetSingleItem',
    'version': '967',
    'responseencoding': 'JSON',
    'siteid': '0',
    'ItemID': ItemID,
    'IncludeSelector':'Details, ItemSpecifics'
    }

    response = requests.get(endpoint, params=params, headers=headers)
    return(response.json())




if __name__ == '__main__':
    app.run(debug=True)
