export class UserConfig implements IUserConfig {
  constructor(
    public module = 'Home',
    public editor_mode = 'edit',
    public zoom = 1,
    public zoom_max = 1.6,
    public zoom_min = 0.5,
    public zoom_value = 0.1,
    public zoom_last_value = 1
  ) {
  }
}
