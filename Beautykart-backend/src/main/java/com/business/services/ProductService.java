package com.business.services;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.business.entities.Product;
import com.business.repositories.ProductRepository;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        return (List<Product>) productRepository.findAll();
    }

    public Product getProduct(int id) {
        return productRepository.findById(id).orElse(null);
    }

    public Product addProduct(Product input) {
        validate(input);
        Product product = new Product();   // new entity: client cannot choose the id
        copyFields(input, product);
        return productRepository.save(product);
    }

    public boolean updateProduct(Product input, int id) {
        Optional<Product> existing = productRepository.findById(id);
        if (existing.isEmpty()) {
            return false;
        }
        validate(input);
        Product product = existing.get();
        copyFields(input, product);
        productRepository.save(product);
        return true;
    }

    public boolean deleteProduct(int id) {
        if (!productRepository.existsById(id)) {
            return false;
        }
        productRepository.deleteById(id);
        return true;
    }

    public Product getProductByName(String name) {
        return productRepository.findByPname(name);
    }

    private void validate(Product p) {
        if (p.getPname() == null || p.getPname().isBlank() || p.getPname().length() > 200) {
            throw new IllegalArgumentException("Product name is required (max 200 characters).");
        }
        if (Double.isNaN(p.getPprice()) || Double.isInfinite(p.getPprice())
                || p.getPprice() < 0 || p.getPprice() > 10_000_000) {
            throw new IllegalArgumentException("Product price must be a non-negative number.");
        }
    }

    private void copyFields(Product from, Product to) {
        to.setPname(from.getPname().trim());
        to.setPprice(from.getPprice());
        to.setPdescription(from.getPdescription());
        to.setCategory(blankToNull(from.getCategory()));
        to.setImageUrl(blankToNull(from.getImageUrl()));
    }

    private String blankToNull(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }
}
