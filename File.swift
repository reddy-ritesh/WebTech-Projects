//
//  File.swift
//  HW4
//
//  Created by Ritesh Reddy on 12/2/23.
//

import Foundation
struct ProductSearchView: View {
    @State private var keyword: String = ""
    @State private var selectedCategory: String = ""
    @State private var conditionUsed: Bool = false
    @State private var conditionNew: Bool = false
    @State private var conditionUnspecified: Bool = false
    @State private var pickup: Bool = false
    @State private var freeShipping: Bool = false
    @State private var distance: String = "10"
    @State private var customLocation: Bool = false
    @State private var zipcode: String = ""
    @State private var isKeywordInvalid: Bool = false
    @State private var showError: Bool = false
    @State private var searchResults: [Item] = []

    private var apiManager = APIManager()

    // Define your categories
    let categories: [Category] = [
        // ... your categories here ...
    ]

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search Form
                List {
                    Section {
                        HStack {
                            Text("Keyword:")
                            TextField("Required", text: $keyword)
                                .padding(10)
                        }

                        HStack {
                            Picker("Category", selection: $selectedCategory) {
                                ForEach(categories) { category in
                                    Text(category.name).tag(category.value)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                        }

                        LabelledCheckbox(label: "Condition", checkboxes: [
                            ("Used", $conditionUsed),
                            ("New", $conditionNew),
                            ("Unspecified", $conditionUnspecified)
                        ])

                        LabelledCheckbox(label: "Shipping", checkboxes: [
                            ("Pickup", $pickup),
                            ("Free Shipping", $freeShipping)
                        ])

                        HStack {
                            Text("Distance:")
                            TextField("10", text: $distance)
                                .keyboardType(.numberPad)
                                .frame(width: 50)
                        }

                        if customLocation {
                            HStack {
                                Text("Zipcode:")
                                TextField("", text: $zipcode)
                            }
                        }

                        HStack {
                            Spacer()
                            Button("Submit") {
                                // Your submit action
                            }
                            .buttonStyle(.borderedProminent)

                            Button("Clear") {
                                clearForm()
                            }
                            .buttonStyle(.borderedProminent)
                            Spacer()
                        }
                    }
                }

                // Search Results
                if !searchResults.isEmpty {
                    List(searchResults, id: \.itemId) { item in
                        ItemRowView(item: item)
                    }
                }
            }
            .navigationTitle("Product Search")
        }
    }

    func clearForm() {
        // Your clear form logic
    }

    // Additional functions or structs (like ItemRowView) go here
}

struct ItemRowView: View {
    let item: Item

    var body: some View {
        // Your ItemRowView implementation
    }
}

// Definitions for Category, Item, etc. go here





NavigationView {
    ZStack(alignment: .bottom) {
        List {
            
            Section {
                HStack {
                    Text("Keyword:")
                    TextField("Required", text: $keyword)
                        .padding(10) // Add padding for better touch area
                }
                HStack {
                    Picker("Category", selection: $selectedCategory) {
                        ForEach(categories) { category in
                            Text(category.name).tag(category.value)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    
                }
                
                LabelledCheckbox(label: "Condition", checkboxes: [
                 ("Used", $conditionUsed),
                 ("New", $conditionNew),
                 ("Unspecified", $conditionUnspecified)
                ])
                
                LabelledCheckbox(label: "Shipping", checkboxes: [
                 ("Pickup", $pickup),
                 ("Free Shipping", $freeShipping)
                ])
                
                HStack {
                    Text("Distance:")
                    TextField("10", text: $distance)
                        .keyboardType(.numberPad)
                        .frame(width: 50)
                }
                
                Toggle("Custom location", isOn: $customLocation)
                
                if customLocation {
                    HStack {
                        Text("Zipcode:")
                        TextField("", text: $zipcode)
                        
                    }
                }
                
                HStack {
                    Spacer()
                    Button("Submit") {
                        if keyword.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            showError = true
                            // Consider using a DispatchQueue to hide the error after a delay
                            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                                showError = false
                            }
                        } else {
                            // Handle valid keyword submission
                            showError = false
                            // Call the searchEbayItems function
                            apiManager.searchEbayItems(keyword: keyword, currentPage: 1, entriesPerPage: 50)
                                .done { searchResult in
                                    // Handle success
                                    self.searchResults = searchResult.items
                                    //  print("Page Number: \(searchResult.pageNumber)")
                                    //   print("Total Pages: \(searchResult.totalPages)")
                                    //  print("Total Entries: \(searchResult.totalEntries)")
                                    // Process the items in searchResult.items
                                }
                                .catch { error in
                                    // Handle error
                                    print("Error: \(error.localizedDescription)")
                                }
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    
                    
                    
                    
                    Button("Clear") {
                        clearForm()
                    }
                    .buttonStyle(.borderedProminent)
                    Spacer()
                }
                if !searchResults.isEmpty {
                    
                    Section(header: Text("Results")){
                        ForEach(searchResults, id: \.itemId) { item in
                            ItemRowView(item: item)
                        }
                    }
                }
            }
        }
        .navigationTitle("Product Search")

        if showError {
            Text("Keyword is mandatory")
                .foregroundColor(.white)
                .padding()
                .background(Color.black.opacity(0.7))
                .cornerRadius(10)
                .transition(.slide)
                .animation(.easeIn, value: showError)
                .padding(.bottom, 20) // Adjust the bottom padding as needed
        }
    }
}
}
