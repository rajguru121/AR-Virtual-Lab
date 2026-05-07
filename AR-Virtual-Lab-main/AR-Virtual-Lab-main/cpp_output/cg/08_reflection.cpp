#include <graphics.h>
#include <conio.h>
#include <iostream>
using namespace std;

// Draw a triangle given 3 vertices
void drawTriangle(int x[], int y[], int color)
{
    setcolor(color);
    line(x[0], y[0], x[1], y[1]);
    line(x[1], y[1], x[2], y[2]);
    line(x[2], y[2], x[0], y[0]);
}

int main()
{
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");

    int x[3], y[3];
    int choice;

    cout << "Enter 3 vertices of triangle (x y):" << endl;
    for (int i = 0; i < 3; i++)
    {
        cout << "Vertex " << i + 1 << ": ";
        cin >> x[i] >> y[i];
    }

    cout << "\nReflection about:" << endl;
    cout << "1. X-axis" << endl;
    cout << "2. Y-axis" << endl;
    cout << "3. Origin" << endl;
    cout << "4. Line y = x" << endl;
    cout << "Choice: ";
    cin >> choice;

    int midX = getmaxx() / 2;
    int midY = getmaxy() / 2;

    // Draw axes
    setcolor(DARKGRAY);
    line(0, midY, getmaxx(), midY);
    line(midX, 0, midX, getmaxy());
    outtextxy(10, 10, (char*)"2D Reflection");

    // Shift coordinates to center-based system for drawing
    int ox[3], oy[3], nx[3], ny[3];
    for (int i = 0; i < 3; i++)
    {
        ox[i] = midX + x[i];
        oy[i] = midY - y[i];
    }

    // Draw original triangle in white
    outtextxy(ox[0] + 5, oy[0] - 10, (char*)"Original");
    drawTriangle(ox, oy, WHITE);

    // Apply reflection
    for (int i = 0; i < 3; i++)
    {
        switch (choice)
        {
            case 1: // Reflect about X-axis: (x, -y)
                nx[i] = midX + x[i];
                ny[i] = midY + y[i];
                break;
            case 2: // Reflect about Y-axis: (-x, y)
                nx[i] = midX - x[i];
                ny[i] = midY - y[i];
                break;
            case 3: // Reflect about origin: (-x, -y)
                nx[i] = midX - x[i];
                ny[i] = midY + y[i];
                break;
            case 4: // Reflect about y=x: swap(x, y)
                nx[i] = midX + y[i];
                ny[i] = midY - x[i];
                break;
        }
    }

    // Draw reflected triangle in yellow
    outtextxy(nx[0] + 5, ny[0] - 10, (char*)"Reflected");
    drawTriangle(nx, ny, YELLOW);

    getch();
    closegraph();
    return 0;
}
