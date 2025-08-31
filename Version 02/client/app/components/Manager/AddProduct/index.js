/**
 *
 * AddProduct - Enhanced with all schema fields and multiple image upload
 *
 */

import React, { useState } from 'react';
import { Row, Col } from 'reactstrap';
import { ROLES } from '../../../constants';
import Input from '../../Common/Input';
import Switch from '../../Common/Switch';
import Button from '../../Common/Button';
import SelectOption from '../../Common/SelectOption';

const taxableSelect = [
  { value: 1, label: 'Yes' },
  { value: 0, label: 'No' }
];

const stockStatusSelect = [
  { value: 'In Stock', label: 'In Stock' },
  { value: 'Out of Stock', label: 'Out of Stock' }
];

const AddProduct = props => {
  const {
    user,
    productFormData,
    formErrors,
    productChange,
    addProduct,
    brands,
    images
  } = props;

  // Add state for image preview
  const [selectedImages, setSelectedImages] = useState([]);

  const handleSubmit = event => {
    event.preventDefault();
    addProduct();
  };

  const handleImageChange = (name, files) => {
    // Convert FileList to Array for easier handling
    const fileArray = files ? Array.from(files).filter(file => file instanceof File) : [];
    
    // Store the FileList in form data (as your backend expects)
    productChange(name, files);
    
    // Update preview images with the array
    setSelectedImages(fileArray);
  };

  const handleDimensionChange = (dimension, value) => {
    const currentDimensions = productFormData.dimensions || {};
    const updatedDimensions = {
      ...currentDimensions,
      [dimension]: value ? parseFloat(value) : undefined
    };
    productChange('dimensions', updatedDimensions);
  };

  // Add console log to debug rendering
  console.log('AddProduct rendering with props:', { user, productFormData, formErrors });

  return (
    <div className='add-product'>
      <form onSubmit={handleSubmit} noValidate>
        {/* Basic Product Information */}
        <Row>
          <Col xs='12'>
            <h5 className='mb-3'>Basic Information</h5>
          </Col>
          <Col xs='12' lg='6'>
            <Input
              type={'text'}
              error={formErrors['sku']}
              label={'SKU'}
              name={'sku'}
              placeholder={'Product SKU'}
              value={productFormData.sku || ''}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          <Col xs='12' lg='6'>
            <Input
              type={'text'}
              error={formErrors['name']}
              label={'Name'}
              name={'name'}
              placeholder={'Product Name'}
              value={productFormData.name || ''}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          <Col xs='12' md='12'>
            <Input
              type={'textarea'}
              error={formErrors['description']}
              label={'Description'}
              name={'description'}
              placeholder={'Product Description'}
              value={productFormData.description || ''}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
        </Row>

        <hr />

        {/* Pricing Information */}
        <Row>
          <Col xs='12'>
            <h5 className='mb-3'>Pricing</h5>
          </Col>
          <Col xs='12' lg='6'>
            <Input
              type={'number'}
              error={formErrors['price']}
              label={'Price'}
              name={'price'}
              min={1}
              placeholder={'Product Price'}
              value={productFormData.price || ''}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          <Col xs='12' lg='6'>
            <Input
              type={'number'}
              error={formErrors['salePrice']}
              label={'Sale Price (Optional)'}
              name={'salePrice'}
              min={0}
              placeholder={'Sale Price'}
              value={productFormData.salePrice || ''}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          <Col xs='12' md='6'>
            <SelectOption
              error={formErrors['taxable']}
              label={'Taxable'}
              name={'taxable'}
              options={taxableSelect}
              value={productFormData.taxable}
              handleSelectChange={value => {
                productChange('taxable', value);
              }}
            />
          </Col>
        </Row>

        <hr />

        {/* Inventory Management */}
        <Row>
          <Col xs='12'>
            <h5 className='mb-3'>Inventory</h5>
          </Col>
          <Col xs='12' lg='4'>
            <Input
              type={'number'}
              error={formErrors['quantity']}
              label={'Quantity'}
              name={'quantity'}
              decimals={false}
              placeholder={'Product Quantity'}
              value={productFormData.quantity || ''}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          <Col xs='12' lg='4'>
            <Input
              type={'number'}
              error={formErrors['stockQuantity']}
              label={'Stock Quantity'}
              name={'stockQuantity'}
              decimals={false}
              placeholder={'Stock Quantity'}
              value={productFormData.stockQuantity || ''}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
          <Col xs='12' lg='4'>
            <SelectOption
              error={formErrors['stockStatus']}
              label={'Stock Status'}
              name={'stockStatus'}
              options={stockStatusSelect}
              value={productFormData.stockStatus}
              handleSelectChange={value => {
                productChange('stockStatus', value);
              }}
            />
          </Col>
        </Row>

        <hr />

        {/* Physical Properties */}
        <Row>
          <Col xs='12'>
            <h5 className='mb-3'>Physical Properties</h5>
          </Col>
          <Col xs='12' lg='6'>
            <Input
              type={'text'}
              error={formErrors['weight']}
              label={'Weight (Optional)'}
              name={'weight'}
              placeholder={'e.g., 2.5 kg, 500g'}
              value={productFormData.weight || ''}
              onInputChange={(name, value) => {
                productChange(name, value);
              }}
            />
          </Col>
        </Row>

        {/* Dimensions */}
        <Row>
          <Col xs='12'>
            <h6 className='mb-2'>Dimensions (Optional)</h6>
          </Col>
          <Col xs='12' lg='4'>
            <Input
              type={'number'}
              error={formErrors['dimensions.length']}
              label={'Length'}
              name={'dimensions.length'}
              placeholder={'Length'}
              value={productFormData.dimensions?.length || ''}
              onInputChange={(name, value) => {
                handleDimensionChange('length', value);
              }}
            />
          </Col>
          <Col xs='12' lg='4'>
            <Input
              type={'number'}
              error={formErrors['dimensions.width']}
              label={'Width'}
              name={'dimensions.width'}
              placeholder={'Width'}
              value={productFormData.dimensions?.width || ''}
              onInputChange={(name, value) => {
                handleDimensionChange('width', value);
              }}
            />
          </Col>
          <Col xs='12' lg='4'>
            <Input
              type={'number'}
              error={formErrors['dimensions.height']}
              label={'Height'}
              name={'dimensions.height'}
              placeholder={'Height'}
              value={productFormData.dimensions?.height || ''}
              onInputChange={(name, value) => {
                handleDimensionChange('height', value);
              }}
            />
          </Col>
        </Row>

        <hr />

        {/* Brand and Images */}
        <Row>
          <Col xs='12'>
            <h5 className='mb-3'>Brand & Images</h5>
          </Col>
          <Col xs='12' md='6'>
            <SelectOption
              disabled={user.role === ROLES.Merchant}
              error={formErrors['brand']}
              name={'brand'}
              label={'Select Brand'}
              value={
                user.role === ROLES.Merchant ? brands[1] : productFormData.brand
              }
              options={brands}
              handleSelectChange={value => {
                productChange('brand', value);
              }}
            />
          </Col>
          <Col xs='12' md='6'>
            <Input
              type={'file'}
              error={formErrors['images']}
              name={'images'}
              label={'Product Images'}
              placeholder={'Select multiple images (max 10)'}
              multiple={true}
              accept={'image/*'}
              onInputChange={(name, files) => handleImageChange(name, files)}
            />
            <small className='text-muted'>
              Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB per file. Max 10 files.
            </small>

            {/* Preview section with error handling */}
            {selectedImages && selectedImages.length > 0 && (
              <div className="mt-3 d-flex flex-wrap">
                {selectedImages.map((file, index) => {
                  // Double-check that file is a valid File object before creating object URL
                  if (!(file instanceof File)) {
                    console.warn('Invalid file object at index', index, file);
                    return null;
                  }
                  
                  try {
                    const imageUrl = URL.createObjectURL(file);
                    return (
                      <div key={index} className="me-2 mb-2" style={{ width: "100px" }}>
                        <img
                          src={imageUrl}
                          alt={`preview-${index}`}
                          className="img-fluid rounded"
                          style={{ maxHeight: "100px", objectFit: "cover" }}
                          onLoad={() => {
                            // Clean up object URL to prevent memory leaks
                            URL.revokeObjectURL(imageUrl);
                          }}
                        />
                      </div>
                    );
                  } catch (error) {
                    console.error('Error creating object URL for file:', file, error);
                    return null;
                  }
                })}
              </div>
            )}
          </Col>
        </Row>

        <hr />

        {/* Product Status */}
        <Row>
          <Col xs='12'>
            <h5 className='mb-3'>Status</h5>
          </Col>
          <Col xs='12' md='6' className='my-2'>
            <Switch
              id={'active-product'}
              name={'isActive'}
              label={'Active Product?'}
              checked={productFormData.isActive || false}
              toggleCheckboxChange={value => productChange('isActive', value)}
            />
          </Col>
        </Row>

        <hr />

        <div className='add-product-actions'>
          <Button type='submit' text='Add Product' />
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
