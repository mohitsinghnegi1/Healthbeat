//post route file
var fetch = require('node-fetch');
var config = require('../config');
//integrate nutritionix api to get calories of given meal
var getCalories = async (mealName) => {
  var calories = -1;
  var response = await fetch(config.nutritionixEndPoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-id': process.env.XAPPID,
      'x-app-key': process.env.XAPPKEY,
      'x-remote-user-id': '0',
    },
    body: JSON.stringify({ query: mealName }),
  });
  console.log('response');
  return response.json();
};

const Meal = require('../db/modals/Meal');
const express = require('express');
const router = express.Router();
router.post('/', async (req, res) => {
  // console.log('reqbody :', req.body);
  let body = req.body;
  // console.log('body ', body);
  if (!req.body.calorie) {
    // console.log('calories not provided ');
    body.calorie = -1; //get calories from api
    // console.log('meal name ', req.body.mealName);
    await getCalories(req.body.mealName).then((data) => {
      console.log('data ', data);

      if (data.hasOwnProperty('message')) {
        body.calorie = -1;
      } else {
        body.calorie = data.foods[0].nf_calories;
      }
    });
  }
  console.log('body after api call ', body);
  if (body.calorie != -1) {
    let mealModel = new Meal(body);

    mealModel
      .save()
      .then(() => {
        console.log(mealModel);
        res.status(200).send('meal posted successfully' + mealModel);
        return;
      })
      .catch((e) => {
        console.log(mealModel);
        res.status(400).send('Exception :' + e);
        return;
      });
  } else {
    res
      .status(400)
      .send('Error :' + 'Meal with ' + body.mealName + ' does not exists');
  }
});

router.get('/', async (req, res) => {
  try {
    let mealModel = await Meal.find().limit(5);

    res.status(200).send(mealModel);
  } catch (e) {
    res.status(404).send('no meal info found');
  }
});

// this route will get specific meal if exist
router.get('/:mealId', async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.mealId);
    if (!meal) {
      res.send(`no meal found with id ${req.params.mealId} `);
      return;
    }
    console.log('meal', meal);
    res.json(meal);
  } catch (e) {
    res.status(404).send(e);
  }
});

// this route will get specific meal if exist
router.delete('/:mealId', async (req, res) => {
  try {
    const meal1 = await Meal.deleteOne({ _id: req.params.mealId });

    res.send(meal1);
  } catch (e) {
    res.status(404).send('meal not found to delete');
  }
});

// this route will get specific meal if exist
router.patch('/:mealId', async (req, res) => {
  const updateOps = {};
  //we are expecting body like [{'propName':"firstName,'value':"mohit"},{'propName':"lastName,'value':"singhNegi"}]
  req.body.forEach((ops) => {
    updateOps[ops.propName] = ops.value;
  });
  // some other method to update
  // const updateduser = await Meal.updateOne(
  //   { _id: req.params.mealId },
  //   { $set: updateOps }
  // );

  Meal.updateOne({ _id: req.params.mealId }, { $set: updateOps })
    .exec()
    .then((response) => {
      res.status(200).send(response);
    })
    .catch((error) => {
      res.status(404).send(error);
    });
});

module.exports = router;
