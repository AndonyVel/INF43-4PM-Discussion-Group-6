# SportsZone
### Group Members: Andony Velasquez Carrillo, Kevin Yao (kyao11), Ulises Reyes (ureyes2), Daniel Arutti (darutti)


## Execute Review
A lot of modern-day sports require at least one other person. Basketball, Soccer, Baseball, Tennis, etc., can
all somehow be played alone, but it is not the same. Finding a person or people to play with may be hard at times
because everyone is constantly busy, has something to do, or just can’t find the time to do an activity they love.
If the user only has time on specific days, they should be able to find a time to have fun, without worrying about 
people to do it with.

Our app aims to get rid of all the texting, schedule planning, finding available times, and anything that is not
the fun activity itself. To do this, we want to create an app that allows users to find people to play with based on
a sport, the distance between them, skill level, and, most importantly, time availability. Users simply create a profile, filter
the sport(s) they want to play, how far they're willing to travel, and the time that they're available. The app automatically
matches them to people with the same filters. 

The target audience that we want to impact is simple recreational sports players who just want to find people to play with, while
also not struggling to find the time to do so. Whether it's a college student with three hours between their classes or a parent who
wants to play a simple game of basketball, SportsZone provides the platform to do so. 


## Application Context/ Environmental Constraints
The SportsZone application is a mobile platform for iOS and Android designed for active use in real-world environments like public parks, outdoor courts, and indoor recreation centers. The application needs permission from users to constantly check the phone’s GPS, use data, and send push notifications, even if it is running in the background. The system depends on third-party mapping APIs, such as Google Maps, for location rendering and spatial calculations, paired with a robust cloud backend to instantly synchronize live user availability and chat messages.  


## Functional Requirements
### Suggested Features
Closed set of developer-defined interests (sport categories and maybe skill level).
* Basic flow use case: Users select a category for a game they want to play and find people nearby subscribed to the category who’d want to play.
* Alternative flow use case: Users select random categories and don’t use it to sort games they want.
* Exceptional flow use case: Users don’t subscribe to a category and ignore the feature entirely.

Users can subscribe to multiple interests.
* Basic flow use case: users subscribe to multiple categories and can play in them all.
* Alternative flow use case: user chooses one category.
* Exceptional flow use case: user doesn’t choose any interests.

Chat for matching users.
* Basic flow use case: users will chat with matched users to plan meetups and discuss when/how to play.
* Alternative flow use case: users chat to filter if they want to play with a certain person or not.
* Exceptional flow use case: users don’t chat at all.

Pre-planning meeting support.
* Basic flow use case: users use built-in tools to organize meetings 
* Alternative flow use case: a user proposes a plan and the other user accepts, modifies, or declines through quick actions instead of full chat
* Exceptional flow use case: users don’t use tools (external tools)

Limits on location sharing (user can enable and disable whenever).
* Basic flow use case: users enable location sharing to help find nearby matches and disable it when they no longer want to be discovered
* Alternative flow use case: users keep location sharing off by default and only enable it when searching for matches
* Exceptional flow use case: users forget location sharing is enabled, potentially exposing sensitive information, or disable it and experience reduced match quality

Randomized noise location (shows general area, for privacy).
* Basic flow use case: displays approximate location instead of exact coordinates to protect user privacy while still maintaining matching needs
* Alternative flow use case: users adjust the level of location precision depending on comfort and matching needs (city vs neighborhood)
* Exceptional flow use case: location noise is too broad for matching or too narrow to accidentally reveal exact location

### Original Features
Account making and age verification (ask user to verify age).
* Basic flow use case: user is able to create an account with real age
* Alternative flow use case: user creates an account with a fake age
* Exception flow use case: user is unable to create an account due to age verification

Track past activities (see history of locations, people who participated).
* Basic flow use case: user checks history of past activities and asks past group members if they want to play again.
* Alternative flow use case: user only checks history without contacting past group members
* Exception flow use case: user doesn’t check past activities
