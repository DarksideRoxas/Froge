const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    favorite: {
        type: String
    },
    isFrogmaster: {
        type: Boolean,
        default: false
    }
});

const commentSchema = new mongoose.Schema(
    {
        author: {
            type: String,
            required: true
        },
        text: {
            type: String,
            required: true
        }
    },
    {
        timestamps: {
            createdAt: "created_at"
        }
    }
);

const blogpostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    body: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true,
        default: "Frogmaster"
    },
    comments: [commentSchema]
},{
    timestamps: {
        createdAt: "created_at"
    }
});

const User = mongoose.model("User",userSchema,"users");
const BlogPost = mongoose.model("BlogPost", blogpostSchema, "blogposts");

module.exports = { BlogPost, User };
