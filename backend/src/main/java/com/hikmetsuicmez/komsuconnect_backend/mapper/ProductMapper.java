package com.hikmetsuicmez.komsuconnect_backend.mapper;

import com.hikmetsuicmez.komsuconnect_backend.dto.response.ProductResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    @Mapping(source = "businessProfile.id", target = "businessProfileId")
    ProductResponse toResponse(Product product);

    List<ProductResponse> toResponseList(List<Product> products);
}
