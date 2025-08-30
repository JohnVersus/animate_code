# Code Animator - Troubleshooting Guide

## IndexedDB Issues

If you encounter database errors like "DatabaseClosedError" or "Internal error opening backing store for indexedDB.open", try these solutions:

### Quick Fixes

1. **Refresh the page** - Often resolves temporary issues
2. **Close other tabs** - Multiple instances can cause conflicts
3. **Try a different port** - If running on localhost:3000, try localhost:3001

### Advanced Solutions

1. **Clear Browser Data**:

   - Open Developer Tools (F12)
   - Go to Application/Storage tab
   - Find IndexedDB section
   - Delete "CodeAnimatorDB"
   - Refresh the page

2. **Use Debug Options**:

   - If you see a storage error in the app
   - Click "Debug Options"
   - Use "Clear All Data" (⚠️ This deletes all projects)

3. **Browser Issues**:
   - Try a different browser (Chrome, Firefox, Safari)
   - Disable browser extensions temporarily
   - Check if private/incognito mode works

### Prevention

- Don't run multiple instances on different ports simultaneously
- Regularly export your projects as backup
- Use modern browsers with good IndexedDB support

### Still Having Issues?

The app includes automatic recovery mechanisms:

- Database recreation on corruption
- Graceful fallbacks when storage fails
- User-friendly error messages with recovery options

If problems persist, try using the app in a fresh browser profile or contact support.
