# SportsZone — Architectural Documentation

## Part 1 
### Prototype 1 - Hand Sketched Model
<img width="341" height="512" alt="image" src="https://github.com/user-attachments/assets/6c739f87-5247-49c2-8090-973dfb99eba8" />

For the first-ever prototype, we wanted to get a general idea of what the main screen of the app would look like. This does not include filters or any of the more complicated features. Simply, when someone is searching for a sport within a radius, they are provided with the people within that radius. As you can see, it’s the main SportsZone screen, including messages, explore tab, history, profile, filters, and much more. This would serve as a base for much more to come and allowed us to put all our thoughts onto a physical drawing. Bottom left shows chats with people. The current tab shows the people who are available to play with based on the filter chosen. By clicking on one of the names and availability, you’ll be able to message them regarding playing/going further. Bottom right is the history section, which shows the people you've played with in the past. The top right shows the profile section, which includes customization, privacy, identification, and more. Top left is the filters dropdown which allows users to choose which sport, when, and much more.

### Prototype 2 - Computer Design Model
<img width="512" height="263" alt="image" src="https://github.com/user-attachments/assets/d0e2a953-3268-4291-92e1-04caf0835c80" />


### Prototype 3 - Claude Design Model 
<table>
  <tr>
    <td><img width="236" height="512" alt="Discover" src="https://github.com/user-attachments/assets/b950f279-9c96-47fd-a65c-fb6365f7af1c" /></td>
    <td><img width="229" height="512" alt="Chat" src="https://github.com/user-attachments/assets/1e2ad2f4-b672-4af1-bfc6-56c61ff20c6a" /></td>
  </tr>
  <tr>
    <td><img width="223" height="512" alt="History" src="https://github.com/user-attachments/assets/4b5fa940-eff6-4ffd-97cd-716e008232a1" /></td>
    <td><img width="238" height="512" alt="You" src="https://github.com/user-attachments/assets/29fa5454-6941-4299-9ede-172ca7473da7" /></td>
  </tr>
</table>


The four images above show a general idea of how our finalized app will look and incorporate our requirements. We want to make it easy for people to see the people filtered by their selections, while also making it easy to navigate between chat, history, discover, and profile. These were some of the requirements we wanted to include and believed were fitting for an app such as this. We expect the user to tap on discover when they’re ready to find people to play with. The top right shows filters that allow them to choose the sport, radius, level of competitiveness, and more. The chats will allow them to communicate with others who also want to play the sport. The history tab will allow users to communicate with previous people played with and have an easier time communicating with past partners. The profile section includes a lot of verification and personal/privacy information that lots of apps need in order to run. 


## Part 2
### Visibility of System Status

- **Live Count:** The green dot and live count on the Discover screen gives the user real time feedback on current activity within the area ("5 players looking right now")
- **Online vs Offline:** In the chat screen, a green "active now" indicator is displayed when a user is online. This allows the user to know that their match is currently online before sending a message
- **Chat Header:** To confirm the context of the group chat, a chat header is used for the users to understand the context of the conversation

### Match System Words to the Real World

- **Skill Level:** One word labels are used to categorize skill levels ("Casual", "Intermediate", "Competitive"). This naturally describes the user's preference of skill without any complex explanation
- **"What Others See":** Frames the privacy map from the user's social perspective rather than a technical data perspective, giving a better understanding to the user
- **Age Verification:** Language that mirrors real-world ID verification concepts is utilized to make the process smoother without any confusion

### User Control and Freedom

- **"Again" Button:** On History, the button can be utilized to re-initiate past sessions without having to search from scratch, giving the user more freedom for repeated sessions
- **Sports Update:** The user is free to change their sports and skill categories so that they don't feel locked into their initial choices
- **Filters Button on Discover:** In Discover, the user can change sport, distance, skill level, and time filters at any time to reshape their results without starting over

### Consistency and Standards

- **Bottom Navigation Bar:** The same four icons (Discover, Chats, History, You) are displayed in the same positions on every screen, highlighted in green when active, allowing the user to freely roam around the app consistently
- **Player Card Layout:** Every match card on Discover follows the same structure: avatar/initials on left, name + sport + skill level in center, distance + time below, arrow button on right. No variation makes it more understandable to the user
- **Color Language:** The color green is used exclusively for active/positive states (live count dot, active now badge, toggle on, selected tab, Plan meet button) which helps the user learn its meaning

### Error Prevention

- **"5 players looking right now":** The proactive count prevents users from committing to a location search only to find nobody is there
- **Chat Before "Plan Meet":** The flow encourages conversation first, then formal meetup planning, reducing no-shows from premature commitments or accidental joins from the user
- **Discoverable Toggle with Consequence Explanation:** The consequence tells users what happens when they turn it off ("you won't appear in anyone's feed") prevents accidental self-removal from matching

### Recognition Rather Than Recall

- **Sport Emoji:** Users recognize basketball, tennis, or pickleball instantly from the icon without having to remember what each category means. This makes each sport category more recognizable instead of just having text
- **Avatar Color-Coding:** Each person has a consistent colored initial circle across all screens so users visually recognize individuals without having to read names
- **History Screen:** The screen shows sport, location, date, duration, and participants. All relevant session details are displayed so users don't have to mentally reconstruct past experiences

### Accelerators

- **"Again" Button on History:** Users who regularly play with the same people can instantly invite their group without going through Discover, filters, and matching again
- **Active Filter Chips on Discover:** Returning users can tap a chip to quickly swap one filter (e.g., change Tonight → Saturday) without opening the full filter panel
- **"Plan Meet" Button in Chat:** The button skips informal back-and-forth for experienced users who are ready to formalize a meetup quickly

### Minimalist Design

- **Dark Background + High Contrast Text:** This color scheme eliminates visual noise and focuses attention on the content (player cards, messages) rather than decorative UI elements, making it more easier to view for the user
- **Player Cards:** Cards show only the 5 most essential pieces of info (name, sport/skill, distance, time, and a single action button) giving efficient and preventing unnecessary information to the user
- **No Ads and Promotional Banners:** The entire interface is dedicated to the core task of finding people to play with without the user having to deal with pop ups or accidental clicks of ads

### Help Users Recognize and Recover From Errors

- **"When off, you won't appear in anyone's feed":** If a user accidentally disables discoverability, the toggle description immediately explains the consequence and implicitly tells them how to fix it (turn it back on)
- **Location Precision Visual Feedback:** If a user sets location too broadly, the "What others see" map preview shows them exactly what that looks like, helping them recognize and correct the setting

### Help and Documentation

- **Age Verification:** Process uses confirmation with date reassures users their verification is complete without them needing to ask ("Age verified · Confirmed via ID · Aug 12 2025")
- **"What Others See" Section Header:** The header turns a privacy setting into a self-explanatory demonstration, eliminating the need for a help article about location privacy for the user
- **Contextual Explanations:** Rather than a separate help section, explanations appear exactly where users need them, preventing them from doing a long process of finding help:
  - "Sessions you've finished · tap to invite the same group again" on History
  - "When off, you won't appear in anyone's feed" on the toggle
  - "Shown as a fuzzy blob (~½ mi radius)" on location precision
  - "3 subscribed · update anytime" on Sports & skill
