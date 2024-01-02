
import Alamofire
import PromiseKit
import Foundation

class APIManager {
    
    func fetchCurrentLocation() async throws -> String? {
        guard let url = URL(string: "https://ipinfo.io/json?token=0c64db14b7f8c7") else {
            throw URLError(.badURL)
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        let response = try JSONDecoder().decode(IPInfoResponse.self, from: data)
        return response.postal
    }
    



    func fetchZipcodeSuggestions(startsWith: String) -> Promise<[String]> {
        return Promise { seal in
            let baseUrl = "https://ass3-404509.wl.r.appspot.com/autocomplete"
            let parameters: [String: Any] = [
                "zip": startsWith,
            ]
            
            AF.request(baseUrl, parameters: parameters)
                .validate()
                .responseDecodable(of: [String].self) { response in
                    switch response.result {
                    case .success(let values):
                        seal.fulfill(values)
                    case .failure(let error):
                        seal.reject(error)
                    }
                }
        }
    }



    
    
    // Function to search eBay items
    func searchEbayItems(keyword: String, currentPage: Int, entriesPerPage: Int, selectedCategory: String,  condition: String, shipping: [String: Bool], distance: String, zip: String) -> Promise<SearchResult> {
        return Promise { seal in
            let urlString = "https://ass3-404509.wl.r.appspot.com/search"
            var params: [String: Any] = [
                "keywords": keyword,
                "page": currentPage,
                "entriesPerPage": entriesPerPage,
                "distance": distance,
                "buyerPostalCode": zip
                
            ]
            
            if !selectedCategory.isEmpty {
                params["categoryId"] = selectedCategory
            }
            
            if !condition.isEmpty {
                params["condition"] = condition
            }
            
            if shipping["localPickup"] == true {
                params["localPickup"] = "true"
            }
            if shipping["freeShipping"] == true {
                params["freeShipping"] = "true"
            }
            
            print(params)
            
            
            AF.request(urlString, parameters: params)
                .validate()
                .responseDecodable(of: SearchResult.self) { response in
                    switch response.result {
                    case .success(let searchResult):
                        seal.fulfill(searchResult)
                    case .failure(let error):
                        seal.reject(error)
                    }
                }
        }
    }
    
    // Function to fetch item details
    func fetchItemDetails(itemId: String) -> Promise<ItemDetails> {
        return Promise { seal in
            let urlString = "https://ass3-404509.wl.r.appspot.com/item/\(itemId)"
            
            AF.request(urlString)
                .validate()
                .responseDecodable(of: ItemDetails.self) { response in
                    switch response.result {
                    case .success(let itemDetails):
                        seal.fulfill(itemDetails)
                    case .failure(let error):
                        seal.reject(error)
                    }
                }
        }
    }
    
    
    func fetchPhotos(forTitle title: String) -> Promise<[String]> {
        return Promise { seal in
            let urlString = "https://ass3-404509.wl.r.appspot.com/search/photos"
            let params: [String: Any] = ["q": title]
            
            AF.request(urlString, parameters: params)
                .validate()
                .responseDecodable(of: [ImageItem].self) { response in
                    switch response.result {
                    case .success(let items):
                        let photoUrls = items.map { $0.link }
                        seal.fulfill(photoUrls)
                    case .failure(let error):
                        seal.reject(error)
                    }
                }
        }
    }
    
    
    func fetchSimilarProducts(itemId: String) -> Promise<[SimilarProduct]> {
        return Promise { seal in
            let urlString = "https://ass3-404509.wl.r.appspot.com/similar-products"
            let params: [String: Any] = ["itemId": itemId]
            
            AF.request(urlString, parameters: params)
                .validate()
                .responseDecodable(of: [SimilarProduct].self) { response in
                    switch response.result {
                    case .success(let similarProducts):
                        seal.fulfill(similarProducts)
                    case .failure(let error):
                        seal.reject(error)
                    }
                }
        }
    }
}

// MARK: - Data Structures for IP Response

struct IPInfoResponse: Codable {
    let ip: String
    let hostname: String
    let city: String
    let region: String
    let country: String
    let loc: String
    let org: String
    let postal: String
    let timezone: String
}

// MARK: - Data Structures for Search Results

struct SearchResult: Decodable {
    var items: [Item]
    var pageNumber: Int
    var totalPages: Int
    var totalEntries: Int
}

struct Item: Decodable {
    var condition: Condition
    var itemId: String
    var title: String
    var price: String
    var galleryURL: String
    var postalCode: String
    var viewItemURL: String
    var shippingInfo: ShippingInfo
    var returnsAccepted: Bool
}

struct Condition: Decodable {
    var conditionId: [String]
    var conditionDisplayName: [String]
}

struct ShippingInfo: Decodable {
    var shippingServiceCost: Double?
    var shipToLocations: [String]?
    var handlingTime: String?
    var expeditedShipping: Bool?
    var oneDayShippingAvailable: Bool?
}

// MARK: - Data Structures for Item Details

struct ItemDetails: Decodable {
    var productId: String
    var title: String
    var pictureUrls: [String]
    var price: Double
    var location: String
    var returnPolicy: ReturnPolicy?
    //        var viewItemURL: String
    var itemSpecifics: [ItemSpecific]
    var shippingCost: Double
    var globalShipping: Bool?
    var handlingTime: Int?
    var seller: Seller
}


struct ReturnPolicy: Decodable {
    var returnsAccepted: String?
    var refund: String?
    var returnsWithin: String?
    var shippingCostPaidBy: String?
    // ... and so on
}

struct ItemSpecific: Decodable {
    var name: String
    var value: [String]
    
    enum CodingKeys: String, CodingKey {
        case name = "Name"
        case value = "Value"
    }
}

struct Seller: Decodable {
    var feedbackScore: Int?
    var popularity: Double?
    var feedbackRatingStar: String?
    var topRated: Bool?
    var storeName: String?
    var buyProductAt: String?
}

//struct GoogleSearchResponse: Decodable {
//    let items: [ImageItem]
//}

struct ImageItem: Decodable {
    let link: String
}

struct SimilarProduct: Decodable {
    let itemId: String
    let productName: String
    let viewItemURL: String
    let price: String
    let shippingCost: String
    let daysLeft: String
    let imageURL: String
}

struct PostalCode: Decodable {
    let postalCode: String
}



