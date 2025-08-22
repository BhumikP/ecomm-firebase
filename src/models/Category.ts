
// src/models/Category.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  image: string;
  subcategories: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema<ICategory> = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  image: {
    type: String,
    trim: true,
    validate: {
      validator: (v: string) => {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/.test(v);
      },
      message: props => `${props.value} is not a valid image URL!`
    }
  },
  subcategories: [{
    type: String,
    trim: true,
  }],
}, { timestamps: true });

// Ensure subcategories are unique within a category before saving
CategorySchema.pre('save', function(next) {
  if (this.isModified('subcategories') && this.subcategories) {
    this.subcategories = Array.from(new Set(this.subcategories.map(s => s.trim()).filter(s => s.length > 0)));
  }
  next();
});

const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
