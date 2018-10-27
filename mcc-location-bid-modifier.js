/**
*
* Location Bid Modifier Script
* MCC Level
*
* This script adds locations with high conversion rates
* and update their bid modifiers on an ongoing basis.
*
* Version: 1.1
* Google AdWords Script maintained by Frederic Harnois
*
**/

// MODIFY YOUR SETTINGS HERE //

// accounts in which the script will run
var ACCOUNTIDS = 'INSERT_CIDs';

// minimum number of conversions for the script to add a bid modifier to a given city
var CONVERSIONTHRESHOLD = 'INSERT_CONVERSION_THRESHOLD'

// minimum number of clicks for the script to add a bid modifier to a given city
var CLICKTHRESHOLD = 'INSERT_CLICK_THRESHOLD'

// DO NOT MODIFY ANYTHING BELOW //

function main() {

	// Gets specified accounts within MCC
	var accountSelector = MccApp.accounts()
		.withIds([ACCOUNTIDS]);
	var accountIterator = accountSelector.get();

	while (accountIterator.hasNext()) {
		var account = accountIterator.next();    
		var accountName = account.getName();
		MccApp.select(account);
        Logger.log("Going through " + accountName)

		// Resets location bid modifiers
		var campaignIterator = AdWordsApp.campaigns().get()
		while (campaignIterator.hasNext()) {
			var campaign = campaignIterator.next();
			var locationIterator = campaign.targeting().targetedLocations().get();

			while (locationIterator.hasNext()) {
				var targetedLocation = locationIterator.next();
				targetedLocation.setBidModifier(1);
				Logger.log("Reset bid modifier of " + targetedLocation.getName());
			}
		}

		// Gets the average conversion rate for the specified date range
		var stats = account.getStatsFor("LAST_30_DAYS");
		var averageConversionRate = stats.getConversionRate();

		// Gets the Geo Performance Report for the specified date range
		var report = AdWordsApp.report(
			'SELECT CountryCriteriaId, CityCriteriaId, CampaignId, CampaignName, Clicks, Impressions, Conversions, Cost ' +
			'FROM   GEO_PERFORMANCE_REPORT ' +
			'WHERE  Conversions > ' + CONVERSIONTHRESHOLD + ' ' +
			'AND Clicks > ' + CLICKTHRESHOLD + ' ' +
			'DURING LAST_30_DAYS', {
				resolveGeoNames: false
			});

		var rows = report.rows();

		while (rows.hasNext()) {
			var row = rows.next();

			if (row['CityCriteriaId'] != 0) {

				// Sets the bid modifier based on the percent change from the average
				var percentChange = (((row['Conversions'] / row['Clicks']) - averageConversionRate)/averageConversionRate)

				if (percentChange >= 1) {
					bidModifier = 1.25
				}

				else if (percentChange > 0 && percentChange < 1){
					bidModifier = 1.15
				}

				else if (percentChange < 0){
					bidModifier = 0.85
				}

				else{
					bidModifier = 1
				}

				var campaignIterator = AdWordsApp.campaigns()
					.withIds([row['CampaignId']])
					.get()

				if (campaignIterator.hasNext()) {
					var campaign = campaignIterator.next();
					var locationIterator = campaign.targeting().targetedLocations().get();
					var campaignLocations = []

					while (locationIterator.hasNext()) {
						var targetedLocation = locationIterator.next();
						var targetedLocationId = targetedLocation.getId();
						campaignLocations.push(targetedLocationId)
					}

					// Updates the bid modifier if the location is already targeted
					if (campaignLocations.indexOf(parseInt(row['CityCriteriaId'])) != -1) {
						targetedLocation.setBidModifier(Number(bidModifier.toFixed(2)))
						Logger.log("Updated " + row['CityCriteriaId'] + "'s bid modifier to " + bidModifier.toFixed(2) + ".")
					}

					// Adds the location with the bid modifier if not
					else {
						campaign.addLocation(row['CityCriteriaId'], Number(bidModifier.toFixed(2)));
						Logger.log("Added " + row['CityCriteriaId'] + " to " + row['CampaignName'] + " with a " + bidModifier.toFixed(2) + " modifier.")
					}	
				}
			}

			else {
				Logger.log("Location is undefined")
			}
		}
	}
}