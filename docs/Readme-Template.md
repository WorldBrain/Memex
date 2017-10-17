# Title (Will the Moose Survive?)

## Purpose
What does this module do?
How is the flow of data structured?
Why did you write it in this way?
What were the thoughts behind the reason for doing things a certain way or for the module in general?

**Example**
This module is designed to give the likelihood that a single moose will survive any given year (by default) or other designated timeframe in any given area.

This module takes in input from a number of real-world sensors tracking things such as:
 - Number of Moose
 - Number of Bears
 - Number of Hunters
 - Amount of edible foliage
 - Fluctuation of Climate

 We wanted to know how likely it is for a moose to survive because we thought this data would be very valuable in choosing the best place to release moose into the wild after recovering from rehab.

We decided to use a combination of Statistical Analysis and Real-world Data Streams. The Statistical Analysis helps make up for the areas in which we either have limited or no access to data to give us averages. Combining this with the real-world data streams makes our calculations super accurate but also adds a lot of Processing Time and isn't the most efficient approach.



## Tasks
What things need to be done?
Which tasks will be the easiest and hardest?

**Example**

**Easy**
[] - Create a simple UI to input Geo Location Bounds & Timeframe

**Medium**
[] - Create a function to pull in all the data from real-world streams and save as an object
[] - Create a function to find which parts of real-world data is missing and substitute with the statistical analysis equivalent

**Hard**
[] - Create Statistical Analysis for each piece of data received
[] - Create the main algorithm to determine the likelihood of moose survival

## Structure
What does each file do?
Any specific things to look out for?
Main function exports?
Inputs => Outputs of the file?

**Example**

#### **[src/environment](src/blacklist/environment.js)**: environment

This takes in all the data from our real-world sources and creates an object that helps give us a clear picture of the environment the moose lives in and the dangers it is likely to face.

Takes in input from several dependencies, servers and the Location Bounds from the GUI.

Outputs an `Environment Object`

``` javascript
{
    Moose: Number,
    Bears: Number,
    Hunters: {
        HuntingMonths: String,
        LicensesGiven: Number,
    }
    Area: Number(sqKm),
    foliage: Number(Kg),
    ClimateRating: Number(0 is best)
}
```

#### **[src/climate](src/blacklist/climate.js)**: climate
Gives us an average of how harsh a climate is for moose.
Input is the timeframe and geo-location bounds
Outputs a number that tells how harsh the environment is for moose `0` being the best and `10` being the worst

## Dependencies
What packages do you use?
What is the purpose of those packages?

**Example**
[moose-generator](moose-generator@github) Gives a real-time number of moose given geo-location bounds used in `environment.js`.
[weather-ratings](weather-ratings@github) Gives averages of weather given a month and geo-location used in `climate.js`


## Contributors
Who Contributed to this module?
Which parts did they work on?
Best way to contact?

**Example**
 - @swissums - document + `environment.js`
 - @mooseman - statistical analysis `stats.js`
 - @algoGod - main algoritm `deathofthemoose.js`
