//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _= require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://noamtamari98:noam8deshalit@cluster0.mwumbab.mongodb.net/todoListDB");

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "please check your data entry, no name specefied!"]
  }
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todoList!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<--- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);



const workItems = [];
app.get("/", function (req, res) {

  Item.find({}).then((items) => {
    if (items.length === 0) {
      Item.insertMany(defaultItems).then(function () {
        console.log("Successfully saved new items to DB");
      })
        .catch(function (err) {
          console.log(err);
        });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  }).catch(err => {
    console.log(err);
  });

});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName })
    .then((foundList) => {
      if (foundList === null) {
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect("/" + customListName);
        console.log('The List has been added!');

      } else {
        console.log('The List already exists!');
        res.render("list", { listTitle: customListName, newListItems: foundList.items });
      }
    })
    .catch((err) => {
      console.log(err);
    });

})

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;


  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {

        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }


});

app.post("/delete", function (req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId).then(function () {
      console.log("Successfully remove items from the DB");
    })
      .catch(function (err) {
        console.log(err);
      });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }).then((foundList) => {
      res.redirect("/" + listName);
    })
      .catch((err) => {
        console.log(err);
      });
  }


});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
