require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const saltRounds = 10;


const app = express();

app.set('view engine', 'ejs');

app.use(
	bodyParser.urlencoded({
		extended: true
	})
);
app.use(express.static("public"));

mongoose.connect(
	"mongodb+srv://sanketrp:Pass123@cluster0.fgfxf.mongodb.net/todolistDB"
);


const itemsSchema = {
	name: {
		type: String,
		required: true,
	},
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
	name: "Welcome to your todolist!",
});

const item2 = new Item({
	name: "Hit the Add button to add an item",
});

const item3 = new Item({
	name: "<-- Hit this button to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
	name: String,
	items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

const userSchema = {
	fName: {
		type: String,
		required: true,
	},
	lName: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	}
};

const User = new mongoose.model("User", userSchema);

app.get("/", function (req, res) {
	Item.find({}, function (err, foundItems) {
		if (foundItems.length === 0) {
			Item.insertMany(defaultItems, function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log("Succesfully completed!");
				}
			});
			res.redirect("/");
		} else {
			res.render("list", {
				listTitle: "Login/SignUp",
				newListItems: foundItems,
			});
		}
	});
});

app.post("/", function (req, res) {
	const itemName = req.body.newItem;
	const listName = req.body.list;

	const item = new Item({
		name: itemName,
	});

	if (listName === "Login/SignUp") {
		item.save();
		res.redirect("/");
	} else {
		List.findOne(
			{
				name: listName,
			},
			function (err, foundList) {
				foundList.items.push(item);
				foundList.save();
				res.redirect("/" + listName);
			}
		);
	}
});

app.get("/login", function (req, res) {
	res.render("login");
});

app.post("/login", function(req,res) {
	const username = req.body.username;
	const password = req.body.password;

	User.findOne({email: username}, function(err, foundUser){
		if (err){
			console.log(err);
		} else {
			if (foundUser) {

				bcrypt.compare(password, foundUser.password, function(err, result) {
					if (result === true) {
						const customListName = _.capitalize(foundUser.fName);
						console.log(foundUser);
						List.findOne(
							{
								name: customListName,
							},
							function (err, foundList) {
								if (!err) {
									if (foundList) {
										res.redirect("/" + customListName); 
									} else {
										//Create a new list right here
										const list = new List({
											name: customListName,
											items: defaultItems,
										});
					
										list.save();
										res.redirect("/" + customListName); 
									}
								}
							}
						);
					} else {
						res.render("login")
					}
				});

			} else {
				res.render("login")
			}
		}
	});
});

app.post("/delete", function (req, res) {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === "Login/SignUp") {
		Item.findByIdAndRemove(checkedItemId, function (err) {
			if (!err) {
				res.redirect("/");
			}
		});
	} else {
		List.findOneAndUpdate(
			{
				name: listName,
			},
			{
				$pull: {
					items: {
						_id: checkedItemId,
					},
				},
			},
			function (err) {
				if (!err) {
					res.redirect("/" + listName);
				}
			}
		);
	}
});

app.get("/register", function (req, res) {
	res.render("register");
});

app.post("/register", function (req,res) {

	bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
		const newUser = new User({
			fName: req.body.fName,
			lName: req.body.lName,
			email: req.body.username,
			password: hash
		});
	
		User.findOne(
			{
				email: req.body.username,
			},
			function (err, foundmail) {
				if(!err) {
					if (!foundmail) {
						newUser.save((err)=>{
							if(err){
								console.log(err);
								res.redirect("/register")
							} else {
								res.redirect("/login")
							}
						});
					} else {
						res.redirect("/register");
					}
				}
			}
		);
	});

})

app.get("/:customListName", function (req, res) {
	const customListName = _.capitalize(req.params.customListName);

	List.findOne(
		{
			name: customListName,
		},
		function (err, foundList) {
			if (!err) {
				if (!foundList) {
					// Show a new list
					const list = new List({
						name: customListName,
						items: defaultItems,
					});

					list.save();

					res.redirect("/" + customListName);
				} else {
					// Create a new list
					res.render("list", {
						namelist: foundList.name,
						listTitle: foundList.name,
						newListItems: foundList.items,
					});
				}
			}
		}
	);
});

let port = process.env.PORT;
if (port == null || port == "") {
	port = 3000;
}

app.listen(port, () => {
	console.log("Server has started succesfully");
});
