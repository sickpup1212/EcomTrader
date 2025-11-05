#!/bin/bash

# API Test Script
# Pipeline Rivers - Quick API verification

echo "╔════════════════════════════════════════════════════════╗"
echo "║  🌊 Trader Backend API Test Suite                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -n "Testing: $description... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "  Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "Starting API tests..."
echo ""

# Health Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "System Health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/health" "Health check"

# Product Endpoints
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Product Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/products/prod_headphones_001" "Get single product"
test_endpoint "GET" "/api/products/prod_headphones_001/reviews" "Get product reviews"

# Admin Endpoints
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Admin Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/admin/stats" "Get dashboard stats"
test_endpoint "GET" "/api/admin/products" "List all products"
test_endpoint "GET" "/api/admin/products?page=1&limit=5" "List products with pagination"
test_endpoint "GET" "/api/admin/products?search=headphones" "Search products"
test_endpoint "GET" "/api/admin/products?category=cat_electronics" "Filter by category"
test_endpoint "GET" "/api/admin/products?status=in_stock" "Filter by status"
test_endpoint "GET" "/api/admin/settings" "Get admin settings"

# Cart Endpoints
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Cart Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/cart" "Get empty cart"
test_endpoint "POST" "/api/cart/items" "Add item to cart" \
    '{"productId":"prod_headphones_001","quantity":1,"variants":{"color":"black"}}'
test_endpoint "GET" "/api/cart" "Get cart with items"

# Wishlist Endpoints
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Wishlist Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/wishlist" "Get empty wishlist"
test_endpoint "POST" "/api/wishlist/items" "Add item to wishlist" \
    '{"productId":"prod_laptop_001"}'
test_endpoint "GET" "/api/wishlist" "Get wishlist with items"

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Test Results                                          ║"
echo "╠════════════════════════════════════════════════════════╣"
echo -e "║  ${GREEN}Passed: $PASSED${NC}                                           ║"
echo -e "║  ${RED}Failed: $FAILED${NC}                                           ║"
echo "╚════════════════════════════════════════════════════════╝"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Backend is working perfectly.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some tests failed. Check the output above.${NC}"
    exit 1
fi
