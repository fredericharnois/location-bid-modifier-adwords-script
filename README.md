# Location Bid Modifier Adwords Script

This script was built to ensure that cities with a high conversion rate are targeted and have a proper bid modifier.  
If scheduled, it will adapt to changes in geographic trends.

## Setup

You will want to define your thresholds for conversions and impressions here:

```javascript
var report = AdWordsApp.report(
	'SELECT CountryCriteriaId, CityCriteriaId, CampaignId, CampaignName, Clicks, Impressions, Conversions, Cost ' +
	'FROM   GEO_PERFORMANCE_REPORT ' +
	// Insert a conversion threshold here
	'WHERE  Conversions > 9 ' +
	// Insert an impression threshold here
	'AND Impressions > 19 ' +
	'DURING LAST_30_DAYS', {
		resolveGeoNames: false
	});
```

You will also want to adjust the date range for the report above and for the conversion rate average here:

```javascript
// Gets the average conversion rate for the specified date range
var stats = account.getStatsFor("LAST_30_DAYS");
var averageConversionRate = stats.getConversionRate();
```

Finally, the script's schedule will likely depend on the date range you choose.
